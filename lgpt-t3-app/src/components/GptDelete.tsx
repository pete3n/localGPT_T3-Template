"use client";

import React, { useState } from 'react';
import { api } from '~/utils/trpc';
import { InfinitySpin } from 'react-loader-spinner';

const GptDeleteButton: React.FC = () => {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteOK, setDeleteOK] = useState<boolean | null>(null);

    const deleteMutation = api.lgptApi.deleteSource.useMutation();
    const handleDeleteClick = () => {
    setIsDeleting(true);
    deleteMutation.mutateAsync()
        .then(deleteOK => {
            setIsDeleting(false);
            setDeleteOK(deleteOK);
        })
        .catch(deleteError => {
            setIsDeleting(false);
            setDeleteOK(false);
            console.error(deleteError)
        })
    };
    
     return (
        <>
            <div className="flex flex-col mt-5 items-center justify-center">
                <button 
                    className="bg-red-950 w-full hover:bg-rose-900 text-white font-bold py-2 px-4 rounded-full text-center transition duration-300 ease-in-out" 
                    onClick={handleDeleteClick}
                >
                    Delete Source Files
                </button>
                {isDeleting &&
                    <div className="flex flex-col mt-5 text-zinc-200 items-center justify-center">
                        Deleting Source Directory...
                        <InfinitySpin
                            width='200'
                            color="#4fa94d"
                        />
                    </div>
                }
                {!isDeleting && (deleteOK !== null) &&
                    <div className="deleteFeedback max-w-[50vw] overflow-hidden">
                        {deleteOK ?
                            <p>Source Directory Deleted and Recreated</p> :
                            <p>Failed to Delete Source Directory</p>
                        }
                    </div>
                }
            </div>
        </>
    );
};

export default GptDeleteButton;
