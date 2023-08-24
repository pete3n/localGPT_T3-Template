"use client";

import React, { useState } from "react";
import { api } from "~/utils/trpc";
import { InfinitySpin } from "react-loader-spinner";

const GptDeleteButton: React.FC = () => {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteOK, setDeleteOK] = useState<boolean | null>(null);

    const deleteMutation = api.lgptApi.deleteSource.useMutation();
    const handleDeleteClick = () => {
        setIsDeleting(true);
        deleteMutation
            .mutateAsync()
            .then((deleteOK) => {
                setIsDeleting(false);
                setDeleteOK(deleteOK);
            })
            .catch((deleteError) => {
                setIsDeleting(false);
                setDeleteOK(false);
                console.error(deleteError);
            });
    };

    return (
        <>
            <div className="mt-5 flex flex-col items-center justify-center">
                <button
                    className="w-full rounded-full bg-red-950 px-4 py-2 text-center font-bold text-white transition duration-300 ease-in-out hover:bg-rose-900"
                    onClick={handleDeleteClick}
                >
                    Delete Source Files
                </button>
                {isDeleting && (
                    <div className="mt-5 flex flex-col items-center justify-center text-zinc-200">
                        Deleting Source Directory...
                        <InfinitySpin width="200" color="#4fa94d" />
                    </div>
                )}
                {!isDeleting && deleteOK !== null && (
                    <div className="deleteFeedback max-w-[50vw] overflow-hidden">
                        {deleteOK ? (
                            <p>Source Directory Deleted and Recreated</p>
                        ) : (
                            <p>Failed to Delete Source Directory</p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default GptDeleteButton;
