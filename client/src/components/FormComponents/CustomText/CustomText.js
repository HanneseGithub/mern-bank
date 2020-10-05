import React from 'react';
import './CustomText.css';

import { NavLink } from 'react-router-dom';

export default class CustomText extends React.Component{
  render() {
    return (
      this.props.textWithLink ?
      <div className={`custom-text ${this.props.className}`}>
        {this.props.customtext} <NavLink to={this.props.routePath}>{this.props.pathName}</NavLink>
      </div>
      :
      <div className={`custom-text ${this.props.className}`}>
        {this.props.customtext}
      </div>
    );
  }
}