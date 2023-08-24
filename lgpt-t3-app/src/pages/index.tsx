import type { NextPage } from 'next';
import GptPrompt from '~/components/GptPrompt';
import GptDropzone from '~/components/GptDropzone';
import GptDeleteButton from '~/components/GptDelete';

const Home: NextPage = () => {
    return (
        <>
            <div className="flex flex-col items-start">
                <h1 className="my-4 text-2xl font-medium mx-auto">
                        Local GPT Template
                </h1>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-500 mb-8">
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
}
export default Home;
