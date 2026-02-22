export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <div className="flex min-h-svh w-full flex-1 flex-col md:min-h-0 md:items-center md:justify-center md:px-8 md:py-8">
        <div className="flex min-h-svh w-full flex-1 flex-col md:min-h-0 md:w-full md:max-w-md md:flex-initial md:mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
