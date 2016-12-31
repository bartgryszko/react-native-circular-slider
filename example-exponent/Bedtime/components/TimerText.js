import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';


export default class TimerText extends Component {

  render() {
    const { minutesLong, ...rest } = this.props;

    const hours = Math.floor(minutesLong / 60);
    const minutes = minutesLong - hours * 60;

    return (
      <View {...rest}>
        <View style={styles.timerContainer}>
          <Text style={styles.time}>{hours}</Text>
          <Text style={styles.text}>HR</Text>
          <Text style={[styles.time, styles.span]}>{minutes}</Text>
          <Text style={styles.text}>MIN</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  time: {
    color: 'white',
    fontSize: 35,
    fontWeight: "300",
  },
  span: {
    marginLeft: 10,
  },
  text: {
    color: 'white',
    fontSize: 15,
    fontWeight: "300",
    marginBottom: 5,
  },
});
