import React from 'react';
import LanguageSelect from './Search/LanguageSelect.js'
import LyricBox from './Play/LyricBox.js'
import MusicPlayer from './Play/MusicPlayer.js'
import './PlayPage.css';
import Script from 'react-load-script';

var funcPlay;
var funcNext;
var funcPrev;

class PlayPage extends React.Component{
  constructor(props) {
    super(props);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.httpGetGeniusSearch = this.httpGetGeniusSearch.bind(this);
    this.httpGetGeniusLyrics = this.httpGetGeniusLyrics.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.nextTrack = this.nextTrack.bind(this);
    this.prevTrack = this.prevTrack.bind(this);
    this.state = {
      trackName:"Track Name",
      artistName:"Artist Name",
      imageURL:"https://i.pinimg.com/originals/b4/75/00/b4750046d94fed05d00dd849aa5f0ab7.jpg",
      songLyrics: "",
      isPlay: false,
    }
  }

  componentDidMount() {
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.handleLoadSuccess();
    };
  }

  handleLoadSuccess() {
    console.log("loaded");
    const token = 'BQBNrSf6BR-PBS-TsE4wU0Q8q2xa_eWt7qGQp9Tb3FRWCSlqp7cFeYL9GmnJYsmNsQt3s2uUdnoUO-6dq-NDaE3ARJeH6idJVtwWguQHZUhzrmzvVhVncbxpW12KJ6_jo_B9aKoUiip8RTWgK3LN6FwrDu7A5KE';
    const player = new window.Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: cb => { cb(token); }
    });
        
    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    var track_name = "";
    // Playback status updates
    player.addListener('player_state_changed', state => { 
      console.log(state);
      // var title = document.getElementById('title');
      var cur_track_name = state.track_window.current_track.name;
      if (track_name !== cur_track_name) {
        track_name = cur_track_name;
        var cur_artist_name = state.track_window.current_track.artists[0].name;
        var genius_json_rsp = this.httpGetGeniusSearch(track_name, cur_artist_name);
        var hits = genius_json_rsp['response']['hits'];
        var imgURL = state.track_window.current_track.album.images[0].url;
        var song;
        var song_url;
        for (var i in hits) {
          var hit = hits[i];
          if (cur_artist_name.toLowerCase() === hit['result']['primary_artist']['name'].toLowerCase()) {
            song = hit;
            console.log(JSON.stringify(song, null, 2))
            break;
          }
        }
        if (song != null) {
          song_url = song['result']['url'];
          let webpage = this.httpGetGeniusLyrics(song_url);
          const parser = new DOMParser()
          let lyrics = parser.parseFromString(webpage, "text/html").getElementsByClassName("lyrics")[0].innerHTML;
          const a_open_regex = /<a([\s\S]*?)>/g;
          const a_close_regex = /<\/a>/g;
          lyrics = lyrics.replaceAll(a_open_regex, '').replaceAll(a_close_regex, '')
          this.setState({trackName: track_name});
          this.setState({artistName: cur_artist_name});
          this.setState({imageURL: imgURL});
          console.log(lyrics);
          this.setState({songLyrics: lyrics});
        }
      }
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();

    funcPlay = () =>{
      player.togglePlay();
    }
    funcNext = () =>{
      player.nextTrack();
    }
    funcPrev = () =>{
      player.previousTrack();
    }

  }

  httpGetGeniusSearch(song_title, artist_name)
  {
    let url = 'https://api.genius.com/'
    url += 'search?q=' + song_title + ' ' + artist_name;
    url += '&access_token=' + 'cPKFxtDU8V0FpvPIxPOBNwivf1yBjgIWibojAcaam5e4fDVnmmsC0s_QaphnkvnS'
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false ); // false for synchronous request
    xmlHttp.send();
    return JSON.parse(xmlHttp.responseText);
  }

  httpGetGeniusLyrics(url)
  {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    url = proxyurl + url
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false ); // false for synchronous request
    xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*')
    xmlHttp.send();
    return xmlHttp.responseText;
  }

  togglePlay() {
    this.setState({
      isPlay: !this.state.isPlay
    })
    console.log("TOGGLE!");
    funcPlay();
  }

  nextTrack() {
    funcNext();
    console.log("NEXT!");
  }

  prevTrack() {
    funcPrev();
    console.log("PREV!");
  }
  
  render(){
      return(
        <div className="PlayPage">
          <div className="PlayingSong">
            <div className="AlbumCover">
              <img src={this.state.imageURL} alt="albumCover" width="128" height="128"></img>
            </div>
            <div className ="SongAndPlayer">
              <p className ="SongTitle"> {this.state.trackName}</p>
              <p className ="Artist"> {this.state.artistName}</p>
              <MusicPlayer togglePlay={this.togglePlay} isPlay={this.state.isPlay} nextTrack={this.nextTrack} prevTrack={this.prevTrack}/>
            </div>
            <LanguageSelect className ="LanguageSelectPlayer"/>
            <Script
              url="https://sdk.scdn.co/spotify-player.js"
            />
          </div>
          <LyricBox lyrics={this.state.songLyrics} title={this.state.trackName}/>
        </div>
      )   
  }

}export default PlayPage;