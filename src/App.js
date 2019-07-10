import React from 'react';
import './App.css';
function importAll(r) {
  let images = {};
  r.keys().map((item) => { images[item.replace('./', '')] = r(item); });
  return images;
}
const action_icons = importAll(require.context('./action_icons', false, /\.png$/));
const TEST_MODEL = {
  "player": "Ram Ram",
  "job": "FSH",
  "encDPS": 0.0,
  "duration": "00:00:00",
  "zone": "kagami-light v190710",
  "time": "2019-05-23 17:00:00.000",
  "isActive": false,
  "actions": []
};
function speedToDuration(speed){
  return (-1.75)*speed+11.75;
}
function convertSize(size){
  return (0.5)*size+0.5;
}
// var OVERLAY_PLUGIN_API;

class KagamiAction extends React.Component{
  render(){
    const animationStyle = `icon-move `+this.props.duration+`s linear`;
    const iconSizeStyle = this.props.action.category===4||this.props.action.category===5?
      2*this.props.size+`rem`:(3*this.props.size)+`rem`;
    return(
      <li style={{animation: animationStyle}}>
        <img style={{height: iconSizeStyle}} src={action_icons[this.props.action.icon]} alt={this.props.action.name} />
      </li>
    )
  }
}

class Range extends React.Component{
  constructor(props){
    super(props);
    this.updateRange = this.updateRange.bind(this);
  }

  updateRange(e){
    this.props.updateRange(e.target.value);
  }

  render(){
    return(
      <div className="Range">
        <span>{this.props.id}</span>
        <input type="range" value={this.props.value} min={this.props.min} max={this.props.max} step={this.props.step} onChange={this.updateRange}></input>
      </div>
    )
  }
}

class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      model: TEST_MODEL,
      lastSeq: -1,
      window: [],
      size: 1,
      speed: 1
    };
  }
  displayResizeHandle() {
    document.documentElement.classList.add("resizeHandle");
  }
  hideResizeHandle() {
    document.documentElement.classList.remove("resizeHandle");
  }

  /* ========================== */
  readActions(actions){
    const duration = speedToDuration(this.state.speed);
    const length = actions.length;
    if(length > 0){
      const size = convertSize(this.state.size);
      for(let i=0; i<length; i++){
        let newWindowArray = this.state.window;
        newWindowArray.push(<KagamiAction key={"w"+actions[i].seq} action={actions[i]} duration={duration} size={size} />)
        this.setState({window: newWindowArray});
      }
      setTimeout(() => {
        let newWindowArray = this.state.window;
        if(newWindowArray.length >= length){
          for(let i=0; i<length; i++) newWindowArray.shift();
          this.setState({window: newWindowArray});
        }
      },duration*1000);
    }
  }

  update(json){
    if(json.time !== this.state.model.time){
      let modelSeq = this.state.lastSeq;
      let pushingActions = [];
      if(json.actions.length > 0){
        if(modelSeq !== -1){
          json.actions.some((action) => {
            if(action.category !== 1){ // is not AA; is action.
              if(action.seq > modelSeq){
                pushingActions.unshift(action);
              }
              else return true; // ignore after duplication
            }
          });
          this.readActions(pushingActions);
        }
        else if(json.actions[0].category !== 1) this.readActions([json.actions[0]]);
        this.setState({lastSeq: json.actions[0].seq});
      }
      this.setState({model: json});
    }
  }

  /* =========================== */
  componentDidMount(){
    document.addEventListener('onActionUpdated', ((e) => {
      this.update(e.detail);
    }));
    document.addEventListener("onOverlayStateUpdate", ((e) => {
      if (!e.detail.isLocked) {
        this.displayResizeHandle();
      } else {
        this.hideResizeHandle();
      }
    }));
    // OVERLAY_PLUGIN_API = window.OverlayPluginApi;
  }
  render(){
    const windowHeight = (4*convertSize(this.state.size))+`rem`;
    const windowAnimation = `bg-move `+(speedToDuration(this.state.speed)*2)+`s linear infinite`;
    return (
      <div id="root">
        <div className="KagamiWindow" style={{height: windowHeight, animation: windowAnimation}}>
          <ul>
            {this.state.window}
          </ul>
        </div>
        <div classNmae="Settings">
          <Range id="speed" value={this.state.speed} min={1} max={5} step={0.1} updateRange={(val) => {this.setState({speed: val});}} />
          <Range id="size" value={this.state.size} min={1} max={5} step={0.1} updateRange={(val) => {this.setState({size: val})}}/>
        </div>
      </div>
    );
  }
}

export default App;