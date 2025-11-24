"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginInProgress, setLoginInProgress] = useState(false);
    const [error, setError] = useState(false);

    async function handleLogin(ev) {
        ev.preventDefault();
        setError(false);
        setLoginInProgress(true);

        // Credentials login via NextAuth
        const result = await signIn("credentials", {
            redirect: false,
            username: email,
            password,
        });

        if (result?.error) {
            setError(true);
        } else {
            // successful login — redirect to home
            window.location.href = "/";
        }

        setLoginInProgress(false);
    }

    return (
        <section className="flex flex-col justify-center items-center min-h-[72vh]">
            {error && (
                <div
                    className="my-4 text-center bg-red-500 py-2 px-6 text-white rounded-full cursor-pointer"
                    onClick={() => setError(false)}
                >
                    An error has occurred. Please try again!!
                </div>
            )}
            <Link href="/" className="flex justify-center items-center mb-12 gap-5">
                <img src="/logo.png" alt="codegamy_logo" className="w-14 h-14 object-contain" />
                <h2 className="font-bold text-3xl">CODELAB</h2>
            </Link>
            <form
                className="block mx-auto w-full max-w-[400px] px-2"
                onSubmit={handleLogin}
            >
                <div className="mb-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        disabled={loginInProgress}
                        onChange={(ev) => setEmail(ev.target.value)}
                        className="shadow-md p-4 bg-light-2 rounded-xl w-full sm:text-sm"
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="password"
                        placeholder="SSHHHH!! Your password"
                        value={password}
                        disabled={loginInProgress}
                        onChange={(ev) => setPassword(ev.target.value)}
                        className="shadow-md p-4 bg-light-2 rounded-xl w-full sm:text-sm"
                    />
                </div>
                <div className="text-center mb-4">
                    <button
                        type="submit"
                        disabled={loginInProgress}
                        className="inline-flex items-center px-8 py-2 mt-4 bg-dark-1 text-white font-medium rounded-lg mx-auto disabled:cursor-not-allowed"
                    >
                        {loginInProgress ? "Loading..." : "Login"}
                    </button>
                </div>

                {/* Google login button */}
                <div className="text-center mt-6">
                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/admin/login/admin_home/" })}
                        className="flex items-center justify-center gap-2 border rounded-lg px-6 py-3 w-full font-medium hover:bg-gray-100"
                    >
                        <FcGoogle className="w-5 h-5" />
                        Login with Google
                    </button>
                </div>

                
            </form>
        </section>
    );
}
