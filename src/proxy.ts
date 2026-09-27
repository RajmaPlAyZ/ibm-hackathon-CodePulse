import { clerkMiddleware } from "@clerk/nextjs/server";

const publicPaths = ["/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, request) => {
  const pathname = new URL(request.url).pathname;
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (!isPublic) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
