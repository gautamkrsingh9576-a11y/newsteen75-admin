import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
 let response = NextResponse.next({request});
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key || !process.env.ADMIN_EMAIL_ALLOWLIST) return request.nextUrl.pathname === '/login' ? response : NextResponse.redirect(new URL('/login?reason=config', request.url));
 const supabase = createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values: {name:string;value:string;options:CookieOptions}[]){values.forEach(({name,value})=>request.cookies.set(name,value)); response=NextResponse.next({request}); values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data:{user},error} = await supabase.auth.getUser();
 const allowed = !error && user?.email && user.email_confirmed_at && process.env.ADMIN_EMAIL_ALLOWLIST.split(',').map(x=>x.trim().toLowerCase()).includes(user.email.toLowerCase());
 if (!allowed && request.nextUrl.pathname !== '/login') return NextResponse.redirect(new URL('/login?reason=unauthorized',request.url));
 if (allowed && request.nextUrl.pathname === '/login') return NextResponse.redirect(new URL('/',request.url));
 return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
