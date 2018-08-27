import React, { Component } from 'react';

export default class AvailableGames extends Component {

  render() {
    return (
      <div className="available-games">
        <h3>Available Games</h3>
        {this.props.renderAvailableGames}
      </div>
    )
  }
}
