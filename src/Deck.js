import React, { Component } from 'react';
import {
  Animated,
  PanResponder,
  View,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_TRESHOLD = SCREEN_WIDTH * 0.5;
const SWIPE_OUT_DURATION = 250;

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH,
  },
};

class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
    renderNoMoreCards: () => {},
  };

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY(0, 0);
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        console.log('a', gesture.dx, SWIPE_TRESHOLD)
        if (gesture.dx > SWIPE_TRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_TRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      },
    });

    this.state = { panResponder, position, index: 0 };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentWillUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental
      && UIManager.setLayoutAnimationEnabledExperimental(true);
      LayoutAnimation.spring();
  }

  getCardStyle() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      // inputRange: [-500, 0, 500], // from -500 pixel to 500 pixels --> bad because of diff screen sizes
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], // from -500 pixel to 500 pixels
      outputRange: ['-20deg', '0deg', '20deg'], // deg of rotation
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  }

  forceSwipe(direction) {
    let x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    x *= 1.1; // making sure it goes all the way out of screen
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
    }).start(() => this.onSwipeComplete(direction)); // when animation is finished, callback function inside start will be called
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];

    direction === 'left' ? onSwipeLeft(item) : onSwipeRight(item);
    this.state.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index + 1 });
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 },
    }).start();
  }

  renderCards() {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data.map((item, i) => {
      if (i < this.state.index) { return null; }

      if (i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
            {...this.state.panResponder.panHandlers}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }
      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyle, { top: 5 * (i - this.state.index), zIndex: 5 }]}
        >
          {this.props.renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  render() {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

export default Deck;
