import type { AppType } from "next/app";
import { api } from "~/utils/trpc";
import "~/styles/globals.css";

const LgptT3App: AppType = ({ Component, pageProps }) => {
    return (
        <>
            <title>Local GPT Template</title>
            <div className="grid-cols-auto grid">
                <div className="flex flex-col items-center">
                    <div className="flex min-h-screen w-full flex-grow justify-center">
                        <Component {...pageProps} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default api.withTRPC(LgptT3App);
