# poem-music

Completed for CMPM202 with Hongwei (Henry) Zhou and Kapil Gupta

*For a demo see `demo`

###### **Environment Setup**

This project contains 3 major parts, each running in separate
environments.

- Poem generation:
    - requires a virtual env at the project root named
    `venv-poem-music-0`
    - this environment should contain the dependencies found in
    `LanguageModels/requirements.txt`, use pip to install these
- Music generation:
    - requires a virtual env created through Anaconda, run
    `curl https://raw.githubusercontent.com/tensorflow/magenta/master/magenta/tools/magenta-install.sh >
     /tmp/magenta-install.sh && bash /tmp/magenta-install.sh` to
     install the env
    - this environment should contain the dependencies found in
    `env-2_requirements.txt`, use pip to install these
    - then download the pretrained models and midi instruments, 
    `gdown --id 1QB1u5H7kaNf9P5RTQda5cRY6-WORBGcA`
- Web: Use `npm i` to install dependencies

###### **Running the Project**

To run the project type `npm run start` from the project root,
then navigate to `localhost:8080` in the browser. Type a poem
prompt in the text input field and pres the `enter` button.
Similarly, press `enter` again to stop the current poem and
input another prompt.

###### **Generating a New Song**

Unlike the poem, the song is not generated in real time. To
generate a new song run `source activate magenta 
&& python musicGen.py && deactivate`. This will overwrite
`public/music.wav`. This may be done dynamically, i.e., while the
server is running.
