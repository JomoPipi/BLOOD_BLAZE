FROM node:slim
ENV PORT=3000
RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install git python make g++ && rm -rf /var/cache/apk/*
RUN git clone https://github.com/jomopipi/BLOOD_BLAZE.git && cd BLOOD_BLAZE
WORKDIR /BLOOD_BLAZE
RUN npm run setup
