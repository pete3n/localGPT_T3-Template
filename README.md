# T3 template project for Local GPT
NOTE: This project is not being actively maintained.

This project shows an example implementation of Local GPT with a web interface built with the T3 stack.<br>
<br>
	- Check out the Local GPT project here: https://github.com/PromtEngineer/localGPT<br>
    - Check out T3 here: https://github.com/t3-oss/create-t3-app<br>
## Getting Started
To run this project you first need to install Docker and Docker Compose, 
follow the instructions located here: https://docs.docker.com/engine/install/
to install Docker, and here: https://docs.docker.com/compose/install/ to install Docker Compose.<br>
<br>
Once you have both installed on your system, you can clone this repo with:

```
git clone https://github.com/pete3n/localGPT_T3-Template.git
```
Or download and unzip the project.<br>
Navigate to the project directory. If you are executing from a Linux
command line run:<br>
```
sudo docker-compose up
```
Or run with Administrator privileges from a Windows command line or Powershell with:<br>
```
docker-compose up
```
Note: it will take several minutes to download and build the containers for the first time.
There is ~10Gb worth of data required between both the app container and local GPT container.<br>
<br>
Once the containers are started, you should be able to navigate your browser to localhost:3000 
and see the web interface:<br>
<br>
![example of project running](./lgpt_t3.jpg)
<br>
Once the service has finished processing the SOURCE_DOCUMENTS you should see the Flask server
listening for requests as shown on the right. Please be patient waiting for the GPT API server
to start, especially if you are starting the container for the first time. If you try to use
the web interface before the GPT API server is ready, you will receive fetch errors.<br>
<br>
## Project Overview

Both the app and gpt containers are configured with the docker-compose.yml in the 
root project directory and pull environment variables from the .env file.<br>
<br>
### Changes to Local GPT
The changes I made to the Local GPT Dockerfile are:<br>
```
# Use port mappings from docker-compose from .env
ARG GPT_LISTENING_IP
ARG GPT_INTERNAL_PORT
ENV GPT_LISTENING_IP=${GPT_LISTENING_IP}
ENV GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}

# These are included for troubleshooting
RUN apt-get install -y vim netcat

# Prevent SOURCE_DOCUMENTS from being empty causing a looping container
COPY constitution.pdf /SOURCE_DOCUMENTS

# Modify the Flask API server parameters so it will listen on the configured interface and port
RUN echo "GPT_LISTENING_IP=${GPT_LISTENING_IP} and GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}"
RUN sed -i "s|app.run(.*)|app.run(debug=False, host='${GPT_LISTENING_IP}', port=${GPT_INTERNAL_PORT})|" /run_localGPT_API.py

CMD python run_localGPT.py --device_type $device_type
```
This allows configuring the API to listen outside the container on a port specified in the environment file.<br>
The localGPT_docker directory contains a seperate docker-compose.yml which can be used to launch
the Local GPT container separately from the app container.<br>

### Changes to T3
Most of the T3 configuration follows the T3 boilerplate code, but there are some specific
changes for this project, along with the components and router for Local GPT:<br>
<br>
[lgpt-t3-app/src/api/trpc/\[trpc\].ts](lgpt-t3-app/src/pages/api/trpc/\[trpc\].ts)

Configured the pages router to allow for 100mb GET/POST bodies:<br>
```
export const config = {
    api: {
            bodyParser: {
                sizeLimit: '100mb',
            },
        responseLimit: '100mb'
    }
};
```
[lgpt-t3-app/src/env.mjs](lgpt-t3-app/src/env.mjs)

Added GPT_URL and API route environment variables:<br>
```
  server: {
    GPT_URL: z.string().url(),
    GPT_PROMPT_ROUTE: z.string(),
    GPT_PROMPT_BODY_KEY: z.string(),
    GPT_SAVE_ROUTE: z.string(),
    GPT_DELETE_ROUTE: z.string(),
    GPT_INGEST_ROUTE: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),

  runtimeEnv: {
    GPT_URL: process.env.GPT_URL,
    GPT_PROMPT_ROUTE: process.env.GPT_PROMPT_ROUTE,
    GPT_PROMPT_BODY_KEY: process.env.GPT_PROMPT_BODY_KEY,
    GPT_SAVE_ROUTE: process.env.GPT_SAVE_ROUTE,
    GPT_DELETE_ROUTE: process.env.GPT_DELETE_ROUTE,
    GPT_INGEST_ROUTE: process.env.GPT_INGEST_ROUTE,
    NODE_ENV: process.env.NODE_ENV,
```
[lgpt-t3-app/src/server/api/routers/lgptApi.ts](lgpt-t3-app/src/server/api/routers/lgptApi.ts)

Is the tRPC router that handles API calls to the localGPT API server. Because tRPC doesn't have
native support for FormData (I tried the experimental support, but couldn't get it to work properly),
and node doesn't have a Blob type compatible with the DOM's Blob type, the easiest way to pass 
a validated data form between the frontend and backend is just to send a base64 encoded string as JSON. 
Which necessitates this function:<br>

```
const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(",");
    if (parts.length !== 2) {
        throw new Error("Invalid base64 format");
    }

    const byteCharacters = atob(parts[1] ?? "");
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });

    return blob;
};
```
Since the Prompt response will send back a specific data structure, and for some reason
the delete response doesn't send a standard HTTP response code, we also need to create
interfaces to handle those data shapes and a function to type guard the delete response:<br>

```
interface PromptResponse {
    Answer: string;
    Prompt: string;
    Sources: Array<[string, string]>;
}

interface DeleteResponse {
    message: string;
}

const isDeleteResponse = (obj: unknown): obj is DeleteResponse =>
    typeof obj === "object" &&
    obj !== null &&
    "message" in obj &&
    typeof (obj as DeleteResponse).message === "string";
```
The saveDocument procedure is just a basic implementation of the tRPC public procedure
that needs to validate the input data shape with Zod and reconstructs a FormData object
using the filename and our recreated file blob. If you are familiar with tRPC, none
of the other procedures should require any explanation.<br>
<br>
[lgpt-t3-app/src/components/GptDropzone.tsx](lgpt-t3-app/src/components/GptDropzone.tsx)
<br>
The GptDropzone uses React's Dropzone and Infinity Spinner for UI components to
upload and ingest files to the Local GPT container. There are some hardcoded values for the
dropzone which restricts the MIME types and extensions allowed and the filesize limit
is set to 100Mb to match our tRPC config:<br>

```
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

```
The rest of the Dropzone implementation is pretty standard. It has state objects to
track the status of file uploads, file ingests, and succesfully uploaded and ingested files.
There is a known bug that ingesting will report that it has succeeded before the ingest process
has finished. Ingesting can take a very long time depending on your configuration and 
I couldn't find a good way to implement this with a REST API.<br>
<br>
[lgpt-t3-app/src/components/GptPrompt.tsx](lgpt-t3-app/src/components/GptPrompt.tsx)
<br>
The GptPrompt is a React component that combines a form search bar with a 
formatted text div to display respones in. It has state objects to track user prompts
and Local GPT responses so that a chat history can be displayed.<br>
<br>
[lgpt-t3-app/src/components/GptDelete.tsx](lgpt-t3-app/src/components/GptDelete.tsx)
<br>
The GptDeleteButton is a simple React button component a triggers the Local GPT API endpoint
to delete and re-create the SOURCE_DOCUMENTS directory. I have notice a bug that if you configure
docker-compose to mount a persistent volume for your SOURCE_DOCUMENTS directory, if you 
execute the delete operation, the script will execute correctly, but it will throw a file-permission
error which prevents the API from reporting that it performed the operation and results in the
UI showing that it failed.






