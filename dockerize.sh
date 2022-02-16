#!/bin/bash
#You will need to authenticate with the server.
#Ensure your key is in ~/.ssh/id_rsa and your ~/.ssh/config file has the host information:
#   Host brony-nb
#   User noisebridge
#   Port 1235
#   Hostname 199.241.139.224
#   PreferredAuthentications publickey
#   IdentityFile ~/.ssh/id_rsa

    ssh brony-nb ' 
        cd /srv/BLOOD_BLAZE
        docker-compose build --no-cache blood_blaze
        docker-compose up -d 
        docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
        exit'
