"use client";

import type {} from "react-dropzone";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "~/utils/trpc";
import { InfinitySpin } from "react-loader-spinner";

const acceptedFormats = {
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
    ],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

// This is necessary because tRPC only supports JSON
// It does have experimental FormData support, but I couldn't get it to function properly
const fileToBase64 = (
    file: File
): Promise<{ name: string; base64: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () =>
            resolve({ name: file.name, base64: reader.result as string });
        reader.onerror = (error) => reject(error);
    });
};

const GptDropzone: React.FC = () => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [failedUploads, setFailedUploads] = useState<string[]>([]);
    const [isIngesting, setIsIngesting] = useState<boolean>(false);
    const [ingestOK, setIngestOK] = useState<boolean | null>(null);

    const saveDocumentMutation = api.lgptApi.saveDocument.useMutation();
    const runIngestMutation = api.lgptApi.runIngest.useMutation();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            setIsUploading(true);
            const tempUploaded: string[] = [];
            const tempFailed: string[] = [];

            acceptedFiles.forEach((file) => {
                fileToBase64(file)
                    .then((fileData) => {
                        saveDocumentMutation
                            .mutateAsync(fileData)
                            .then((isUploaded) => {
                                if (isUploaded) {
                                    tempUploaded.push(file.name);
                                } else {
                                    tempFailed.push(file.name);
                                }
                            })
                            .catch((uploadError) => {
                                setIsUploading(false);
                                console.error(uploadError);
                            });
                    })
                    .catch((mutateError) => {
                        setIsUploading(false);
                        console.error(mutateError);
                    });
            });
            setIsUploading(false);
            setUploadedFiles(tempUploaded);
            setFailedUploads(tempFailed);

            setIsIngesting(true);
            runIngestMutation
                .mutateAsync()
                .then((isIngested) => {
                    setIsIngesting(false);
                    if (isIngested) {
                        setIngestOK(true);
                    } else {
                        setIngestOK(true);
                    }
                })
                .catch((ingestError) => {
                    setIsIngesting(false);
                    console.error(ingestError);
                });
        },
        [saveDocumentMutation, runIngestMutation]
    );

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragReject,
        fileRejections,
    } = useDropzone({
        onDrop,
        accept: acceptedFormats,
        maxSize: MAX_FILE_SIZE,
    });

    const rejectionFeedback = fileRejections.flatMap((rejection) =>
        rejection.errors.map((error) => error.message)
    );

    return (
        <>
            <div className="mt-5 flex flex-col items-center justify-center">
                {isUploading && (
                    <div className="mt-5 flex flex-col items-center justify-center text-zinc-200">
                        Uploading file...
                        <InfinitySpin width="200" color="#4fa94d" />
                    </div>
                )}
                {isIngesting && (
                    <div className="mt-5 flex flex-col items-center justify-center text-zinc-200">
                        Ingesting files... (Be patient this could take a while)
                        <InfinitySpin width="200" color="#4fa94d" />
                    </div>
                )}
            </div>

            {!isUploading && !isIngesting && (
                <div className="mt-4">
                    <div
                        {...getRootProps()}
                        style={{
                            border: "2px dashed gray",
                            padding: "20px",
                            textAlign: "center",
                        }}
                    >
                        <input {...getInputProps()} />
                        {isDragReject ? (
                            <p>
                                Unsupported file type. Please drop only PDF,
                                TXT, CSV, XLS, or XLSX files.
                            </p>
                        ) : isDragActive ? (
                            <p>Drop the files here ...</p>
                        ) : (
                            <p>
                                Drag & drop files here to upload and ingest, or
                                click to select files
                                <br />
                                Supported file types: PDF, TXT, CSV, XLS, or
                                XLSX (100 Mb max size)
                            </p>
                        )}
                    </div>
                    {rejectionFeedback.length > 0 && (
                        <div className="rejectionFeedback max-w-[50vw] overflow-hidden">
                            {rejectionFeedback.map((message, index) => (
                                <p key={index}>{message}</p>
                            ))}
                        </div>
                    )}
                    {uploadedFiles.length > 0 && (
                        <div className="uploadedFilesFeedback max-w-[50vw] overflow-hidden">
                            <h3>Uploaded Files:</h3>
                            {uploadedFiles.map((file, index) => (
                                <p key={index}>{file}</p>
                            ))}
                        </div>
                    )}
                    {failedUploads.length > 0 && (
                        <div className="failedUploadFeedback max-w-[50vw] overflow-hidden">
                            <h3>Failed Uploads:</h3>
                            {failedUploads.map((file, index) => (
                                <p key={index}>{file}</p>
                            ))}
                        </div>
                    )}
                    {ingestOK !== null && (
                        <div className="ingestFeedback max-w-[50vw] overflow-hidden">
                            {ingestOK ? (
                                <p>File Ingest Succeeded</p>
                            ) : (
                                <p>File Ingest Failed</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default GptDropzone;
