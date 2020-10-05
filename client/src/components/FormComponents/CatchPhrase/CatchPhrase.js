import React from 'react';
import './CatchPhrase.css';

export default class CatchPhrase extends React.Component{
  render() {
    return (
      <div className={`catchphrase ${this.props.className}`}>
        {this.props.catchphrase}
      </div>
    );
  }
}