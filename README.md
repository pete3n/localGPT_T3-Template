# T3 template project for Local GPT
This project show an example implementation of Local GPT with a web interface built with the T3 stack.<br>
<br>
	- Check out the Local GPT project here: https://github.com/PromtEngineer/localGPT<br>
    - Check out T3 here: https://github.com/t3-oss/create-t3-app<br>
## Getting Started
To run this project you first need to install Docker and Docker Compose, 
follow the instructions located here: https://docs.docker.com/engine/install/
to install Docker and here: https://docs.docker.com/compose/install/ to install Docker Compose.<br>
<br>
Once you have both installed on your system, you can clone this repo with:

```
git clone https://github.com/pete3n/localGPT_T3-Template.git
```

## Project Overview

Both the app and gpt containers are configured with the docker-compose.yml in the 
root project directory and pull environment variables from the .env file.<br>
<br>
The changes I made to the Local GPT Dockerfile are:<br>
```
# Use port mappings from docker-compose from .env
ARG GPT_LISTENING_IP
ARG GPT_INTERNAL_PORT
ENV GPT_LISTENING_IP=${GPT_LISTENING_IP}
ENV GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}

# These are included for troubleshooting
RUN apt-get install -y vim netcat

# Modify the Flask API server parameters so it will listen on the configured interface and port
RUN echo "GPT_LISTENING_IP=${GPT_LISTENING_IP} and GPT_INTERNAL_PORT=${GPT_INTERNAL_PORT}"
RUN sed -i "s|app.run(.*)|app.run(debug=False, host='${GPT_LISTENING_IP}', port=${GPT_INTERNAL_PORT})|" /run_localGPT_API.py

CMD python run_localGPT.py --device_type $device_type
```
This allows configuring the API to listen outside the container on a port specified in the environment file.<br>




