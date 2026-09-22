import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1a] px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-black text-lg">
            SA
          </div>
          <div className="text-left">
            <h1 className="text-xl font-semibold text-white">Stellar Agent Layer</h1>
            <p className="text-xs text-gray-500">Create your account</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-sm">
          Register with Google and start using the Stellar Agent on Testnet.
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
      />
    </div>
  );
}
