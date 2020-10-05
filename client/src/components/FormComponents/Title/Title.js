import React from 'react';
import './Title.css';

export default class Title extends React.Component{
  render() {
    return (
      <div className={`title ${this.props.className}`}>
        {this.props.title}
      </div>
    );
  }
}