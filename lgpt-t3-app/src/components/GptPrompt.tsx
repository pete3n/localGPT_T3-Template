"use client";

import { useState } from "react";
import { api } from "~/utils/trpc";
import { InfinitySpin } from "react-loader-spinner";

const GptPrompt: React.FC = () => {
    const [userPrompt, setUserPrompt] = useState<string>("");
    const [responses, setResponses] = useState<
        Array<{
            answers: string;
            sources: [string, string][];
            originalQuestion: string;
        }>
    >([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const postPromptMutation = api.lgptApi.postPrompt.useMutation();

    const onSearch = (event: React.FormEvent) => {
        event.preventDefault();

        if (userPrompt.trim()) {
            setIsLoading(true);

            postPromptMutation
                .mutateAsync(userPrompt)
                .then((data) => {
                    console.log("Got response data back: ", data.Answer);
                    setResponses((prevResponses) => [
                        {
                            answers: data.Answer,
                            sources: data.Sources,
                            originalQuestion: userPrompt,
                        },
                        ...prevResponses,
                    ]);
                    setUserPrompt("");
                    setErrorMessage(null);
                })
                .catch((error) => {
                    if (error instanceof Error) {
                        console.error(
                            "Error calling tRPC endpoint: ",
                            error.message
                        );
                        setErrorMessage(error.message);
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };

    return (
        <>
            <form className="w-full justify-center" onSubmit={onSearch}>
                <input
                    value={userPrompt}
                    onChange={(event) => setUserPrompt(event.target.value)}
                    className="w-full flex-1 rounded-full bg-zinc-800 px-5 py-1 text-zinc-200 
                        placeholder:text-zinc-400 focus:bg-black focus:outline-none focus:ring-[1px] 
                        focus:ring-green-700 sm:px-5 sm:py-3"
                    placeholder="Enter prompt here..."
                />
            </form>
            <div className="flex flex-col items-center justify-center">
                {errorMessage && (
                    <div className="mt-4 text-red-600">{errorMessage}</div>
                )}

                {isLoading && (
                    <div className="mt-5 flex flex-col items-center justify-center text-zinc-200">
                        Processing prompt... (be patient, this could take
                        several minutes)
                        <InfinitySpin width="200" color="#4fa94d" />
                    </div>
                )}
            </div>
            <div className="mt-10 flex max-w-[50vw] flex-col items-center overflow-hidden rounded-3xl bg-zinc-800 p-4 sm:py-20">
                <div className="max-h-[55vh] overflow-y-auto">
                    {responses.map((response, index) => (
                        <div
                            key={index}
                            className="mx-5 mb-5 border-b-2 border-gray-500 pb-5"
                        >
                            <p className="mb-4 italic">
                                {response.originalQuestion}
                            </p>
                            <h3 className="mb-2 text-xl font-bold">Answer:</h3>
                            <p className="mb-5 break-words">
                                {response.answers}
                            </p>
                            <h3 className="mb-2 text-xl font-bold">Sources:</h3>
                            <ul className="break-words">
                                {response.sources.map((source, sIndex) => (
                                    <li key={sIndex} className="mb-2">
                                        <strong className="break-words">
                                            Document:
                                        </strong>
                                        {source[0]} <br />
                                        <strong>Excerpt:</strong>
                                        {source[1]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default GptPrompt;
