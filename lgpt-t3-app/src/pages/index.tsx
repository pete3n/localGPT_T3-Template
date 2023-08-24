import type { NextPage } from "next";
import GptPrompt from "~/components/GptPrompt";
import GptDropzone from "~/components/GptDropzone";
import GptDeleteButton from "~/components/GptDelete";

const Home: NextPage = () => {
    return (
        <>
            <div className="flex flex-col items-start">
                <h1 className="mx-auto my-4 text-2xl font-medium">
                    Local GPT Template
                </h1>
                <div className="flex flex-col items-center justify-center">
                    <span className="mb-8 text-2xl font-bold text-zinc-500">
                        GPT prompt
                    </span>
                    <div>
                        <GptPrompt />
                    </div>
                    <div>
                        <GptDropzone />
                    </div>
                    <div>
                        <GptDeleteButton />
                    </div>
                </div>
            </div>
        </>
    );
};
export default Home;
