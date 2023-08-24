import type { AppType } from "next/app";
import { api } from "~/utils/trpc";
import "~/styles/globals.css";

const LgptT3App: AppType = ({ Component, pageProps }) => {
    return (
        <>
            <title>Local GPT Template</title>
            <div className="grid grid-cols-auto">
                <div className="flex flex-col items-center">
                    <div className="min-h-screen flex-grow w-full flex justify-center">
                        <Component {...pageProps} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default api.withTRPC(LgptT3App);
