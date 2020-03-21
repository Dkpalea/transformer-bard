import React, { Component } from 'react';
import './app.css';
import ReactImage from './react.png';
import Speech from 'speak-tts';
import Sentiment from 'sentiment';
import happyAudio from '../../public/happy.aac';
import sadAudio from '../../public/sad.aac';
import musicAudio from '../../public/music.mp3';

export default class App extends Component {
  state = { poem: null, apiResponseUrl: null, sentimentResultScore: null, poemPrompt: null };
  volumeFadeOut = null;
  volumeFadeIn = null;

  // componentWillMount() {
  //   fetch('/api/getPoem')
  //     .then(res => res.json())
  //     .then(responseObj => {
  //       console.log(this.state);
  //       this.setState({...responseObj}, () => console.log(this.state));
  //       // OLD tts ------
  //       // const speech = new Speech(); // will throw an exception if not browser supported
  //       // if(speech.hasBrowserSupport()) { // returns a boolean
  //       //   console.log("speech synthesis supported");
  //       //   speech.init().then((data) => {
  //       //     // The "data" object contains the list of available voices and the voice synthesis params
  //       //     console.log("Speech is ready, voices are available", data);
  //       //     speech.setVoice('Alex');
  //       //     setTimeout(() => {
  //       //       // speech.speak({
  //       //       //   text: responseObj.poem,
  //       //       // }).then(() => {
  //       //       //   console.log("Success !")
  //       //       // }).catch(e => {
  //       //       //   console.error("An error occurred :", e)
  //       //       // })
  //       //       let sentiment = new Sentiment();
  //       //       let result = sentiment.analyze(responseObj.poem);
  //       //       console.dir(result);
  //       //     }, 0);
  //       //   }).catch(e => {
  //       //     console.error("An error occured while initializing : ", e)
  //       //   });
  //       // }
  //       // END OLD tts ------
  //     });
  // }

  componentDidMount() {
    console.log('component did mount');
    const inputElement = document.getElementById('input');
    const poemTextElement = document.getElementById('poem');
    const loadingIconElement = document.getElementById('loadingIcon');
    const bodyElement = document.body;
    poemTextElement.classList.add('hidden-initial');
    loadingIconElement.classList.add('hidden-initial');
    document.addEventListener('keyup', (event) => {
      if (event.code === 'Enter') {
        if (document.activeElement === inputElement) {
          this.enterButtonClicked();
          inputElement.classList.remove('fadeIn');
          inputElement.classList.add('fadeOut');
          inputElement.blur();
          loadingIconElement.classList.add('fadeIn');
          loadingIconElement.classList.remove('fadeOut');
          loadingIconElement.classList.remove('hidden-initial');
          setTimeout(() => {
            // loadingIconElement.classList.remove('fadeIn');
            // loadingIconElement.classList.add('fadeOut');
            // poemTextElement.classList.add('fadeIn');
            poemTextElement.classList.remove('fadeOut');
            poemTextElement.classList.remove('hidden-initial');
          }, 3000);
        } else {
          this.restart();
          bodyElement.style.backgroundColor = '#ffffff';
          inputElement.classList.remove('fadeOut');
          inputElement.classList.add('fadeIn');
          inputElement.focus();
          poemTextElement.classList.remove('fadeIn');
          poemTextElement.classList.add('fadeOut');
        }
      }
    })
  }

  enterButtonClicked = () => {
    fetch('/api/getPoem', {
      method: 'POST',
      body: JSON.stringify({ poemPrompt: this.state.poemPrompt }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(responseObj => {
        let sentiment = new Sentiment();
        let sentimentResult = sentiment.analyze(responseObj.poem);
        let activeAudioElement = null;
        let activeTargetVolume = null;
        const musicAudioPlayerElement = document.getElementById('musicAudioPlayer');
        const poemTextElement = document.getElementById('poem');
        const poemAudioPlayerElement = document.getElementById('poemAudioPlayer');
        const happyAudioPlayerElement = document.getElementById('happyAudioPlayer');
        const sadAudioPlayerElement = document.getElementById('sadAudioPlayer');
        const bodyElement = document.body;
        const loadingIconElement = document.getElementById('loadingIcon');
        // hide loading icon when results come back
        loadingIconElement.classList.remove('fadeIn');
        loadingIconElement.classList.add('fadeOut');
        // stop restart interval functions
        window.clearInterval(this.volumeFadeOut);
        // pause all
        musicAudioPlayerElement.pause();
        poemAudioPlayerElement.pause();
        happyAudioPlayerElement.pause();
        sadAudioPlayerElement.pause();
        // reload
        musicAudioPlayerElement.load();
        poemAudioPlayerElement.load();
        // set all to beginning
        // musicAudioPlayerElement.currentTime = 0;
        poemAudioPlayerElement.currentTime = 0;
        happyAudioPlayerElement.currentTime = 0;
        sadAudioPlayerElement.currentTime = 0;
        // set volume
        musicAudioPlayerElement.volume = 0.4;
        poemAudioPlayerElement.volume = 1;
        happyAudioPlayerElement.volume = 0;
        sadAudioPlayerElement.volume = 0;

        if (sentimentResult.score >= 0) {
          // happy
          activeAudioElement = happyAudioPlayerElement;
          activeTargetVolume = 0.3;
          // change bg color
          bodyElement.style.backgroundColor = '#ffea6c';
          // change text color
          poemTextElement.style.color = '#1a1a1a';
        } else {
          // sad
          activeAudioElement = sadAudioPlayerElement;
          activeTargetVolume = 0.2;
          // change bg color
          bodyElement.style.backgroundColor = '#2c345c';
          // change text color
          poemTextElement.style.color = '#eeeeee';
        }

        poemAudioPlayerElement.setAttribute('src', responseObj.apiResponseUrl);
        setTimeout(() => musicAudioPlayerElement.play(), 3750);
        setTimeout(() => poemAudioPlayerElement.play(), 5000);
        activeAudioElement.play();

        const transitionLengthMilSec = 5000;
        const intervalMilSec = 100;
        const incrementPercentAmount = activeTargetVolume/(transitionLengthMilSec/intervalMilSec);

        this.volumeFadeIn = window.setInterval(() => {
          if (activeAudioElement.volume < activeTargetVolume) {
            activeAudioElement.volume = Math.round(100*(activeAudioElement.volume+incrementPercentAmount))/100;
          } else {
            window.clearInterval(this.volumeFadeIn);
          }
        }, intervalMilSec);

        this.setState({...responseObj, sentimentResultScore: sentimentResult.score}, () => console.log(this.state));
      });
  };




  restart = () => {
    const poemTextElement = document.getElementById('poem');
    const poemAudioPlayerElement = document.getElementById('poemAudioPlayer');
    const musicAudioPlayerElement = document.getElementById('musicAudioPlayer');

    poemTextElement.classList.add('fadeOut');
    poemTextElement.classList.remove('hidden-initial');
    poemTextElement.classList.remove('fadeIn');

    const activeTargetVolume = 0;
    const transitionLengthMilSec = 1000;
    const intervalMilSec = 100;
    let activeAudioElement;
    let activeDown = false;
    let poemDown = false;
    let musicDown = false;

    if (this.state.sentimentResultScore >= 0) {
      activeAudioElement = document.getElementById('happyAudioPlayer');
    } else {
      activeAudioElement = document.getElementById('sadAudioPlayer');
    }

    const incrementPercentAmount = activeAudioElement.volume/(transitionLengthMilSec/intervalMilSec);
    const poemIncrementPercentAmount = poemAudioPlayerElement.volume/(transitionLengthMilSec/intervalMilSec);
    const musicIncrementPercentAmount = musicAudioPlayerElement.volume/(transitionLengthMilSec/intervalMilSec);

    this.volumeFadeOut = window.setInterval(() => {
      if (activeAudioElement.volume > activeTargetVolume) {
        activeAudioElement.volume = Math.round(100*(activeAudioElement.volume-incrementPercentAmount))/100;
      } else if (!activeDown) {
        activeAudioElement.pause();
        activeAudioElement.currentTime = 0;
        activeDown = true;
      }

      if (poemAudioPlayerElement.volume > activeTargetVolume) {
        poemAudioPlayerElement.volume = Math.round(100*(poemAudioPlayerElement.volume-poemIncrementPercentAmount))/100;
      } else if (!poemDown) {
        poemAudioPlayerElement.pause();
        poemAudioPlayerElement.currentTime = 0;
        poemDown = true;
      }

      if (musicAudioPlayerElement.volume > activeTargetVolume) {
        musicAudioPlayerElement.volume = Math.round(100*(musicAudioPlayerElement.volume-musicIncrementPercentAmount))/100;
      } else if (!poemDown) {
        musicAudioPlayerElement.pause();
        musicAudioPlayerElement.currentTime = 0;
        musicDown = true;
      }

      if (activeDown && poemDown && musicDown) {
        window.clearInterval(this.volumeFadeOut);
      }
    }, intervalMilSec);
  };

  render() {
    const { poem, apiResponseUrl  } = this.state;
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    if(!isChrome) {
      console.log('Env Not Chrome! :(');
      document.getElementsByClassName('infinityChrome')[0].style.display = "none";
      document.getElementsByClassName('infinity')[0].style.display = "block";
    }
    return (
      <div>
        <div id="loadingIcon" className="infinityChrome">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{display : 'none'}}>
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        {/*<button id="enterButton" onClick={() => this.enterButtonClicked()} />*/}
        <input id="input" autoFocus autoComplete="off" onChange={(e) => this.setState({ ...this.state, poemPrompt: e.target.value })}/>
        <audio id="musicAudioPlayer">
          <source src="music.wav" type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
        <audio id="poemAudioPlayer">
          <source src={apiResponseUrl} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>
        <audio id="happyAudioPlayer">
          <source src={happyAudio} type="audio/aac" />
          Your browser does not support the audio element.
        </audio>
        <audio id="sadAudioPlayer">
          <source src={sadAudio} type="audio/aac" />
          Your browser does not support the audio element.
        </audio>
        <p id="poem">{poem}</p>
      </div>
    );
  }
}
