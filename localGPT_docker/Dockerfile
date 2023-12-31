# syntax=docker/dockerfile:1
# Build as `docker build . -t localgpt`, requires BuildKit.
# Run as `docker run -it --mount src="$HOME/.cache",target=/root/.cache,type=bind --gpus=all localgpt`, requires Nvidia container toolkit.
FROM nvidia/cuda:11.7.1-runtime-ubuntu22.04

# Use port mappings from docker-compose from .env
ARG GPT_LISTENING_IP
ARG GPT_INTERNAL_PORT
ENV GPT_LISTENING_IP=${GPT_LISTENING_IP}
ENV GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}

RUN apt-get update && apt-get install -y software-properties-common

# These are included for troubleshooting
RUN apt-get install -y vim netcat

RUN apt-get install -y g++-11 make python3 python-is-python3 pip

# only copy what's needed at every step to optimize layer cache
COPY ./requirements.txt .

# use BuildKit cache mount to drastically reduce redownloading from pip on repeated builds
RUN --mount=type=cache,target=/root/.cache pip install --timeout 100 -r requirements.txt
RUN --mount=type=cache,target=/root/.cache CMAKE_ARGS="-DLLAMA_CUBLAS=on" FORCE_CMAKE=1 pip install --upgrade --force-reinstall llama-cpp-python

COPY SOURCE_DOCUMENTS ./SOURCE_DOCUMENTS

# Prevent SOURCE_DOCUMENTS from being empty causing a looping container
COPY constitution.pdf /SOURCE_DOCUMENTS

COPY ingest.py constants.py ./

# Docker BuildKit does not support GPU during *docker build* time right now, only during *docker run*.
# See <https://github.com/moby/buildkit/issues/1436>.
# If this changes in the future you can `docker build --build-arg device_type=cuda  . -t localgpt` (+GPU argument to be determined).
ARG device_type=cpu
RUN --mount=type=cache,target=/root/.cache python ingest.py --device_type $device_type
COPY . .
ENV device_type=cuda

# Modify the Flask API server parameters so it will listen on the configured interface and port
RUN echo "GPT_LISTENING_IP=${GPT_LISTENING_IP} and GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}"
RUN sed -i "s|app.run(.*)|app.run(debug=False, host='${GPT_LISTENING_IP}', port=${GPT_INTERNAL_PORT})|" /run_localGPT_API.py

CMD python run_localGPT.py --device_type $device_type
