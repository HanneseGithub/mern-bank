import React from 'react';

import './BalanceScreen.css'

export default class BalanceScreen extends React.Component {
  render() {
    return (
      <div className="d-flex balance-screen justify-content-center align-items-center mb-4">
        {this.props.balance}
      </div>
    )
  }
}