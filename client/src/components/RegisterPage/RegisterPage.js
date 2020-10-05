import React from 'react';
import { Row, Col } from 'reactstrap';

import RegisterForm from '../RegisterForm/RegisterForm'
import illustration from '../../assets/imgs/illustration.png'

export default class RegisterPage extends React.Component {

  render() {
    return (
      <Row className="h-100 w-100">
        <Col sm="6">
          <div className="illustration"></div>
        </Col>
        <Col className="d-flex align-items-center" sm="6">
          <RegisterForm handleRegisterSubmit={this.props.handleRegisterSubmit}/>
        </Col>
      </Row>
    )
  }
}
