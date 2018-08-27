import React, { Component } from 'react';

export default class MyGames extends Component {

  render() {
    return (
      <div className="my-games">
        <h3>My Games</h3>
        {this.props.renderMyGames}
      </div>
    )
  }
}
