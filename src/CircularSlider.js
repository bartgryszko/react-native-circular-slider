import React, { PureComponent, PropTypes } from 'react';
import { PanResponder, View,Platform } from 'react-native';
import Svg, { Circle, G, LinearGradient, Path, Defs, Stop, Text, TSpan } from 'react-native-svg';
import range from 'lodash.range';
import { interpolateHcl as interpolateGradient } from 'd3-interpolate';
import ClockFace from './ClockFace';


function calculateArcColor(index0, segments, gradientColorFrom, gradientColorTo) {
  const interpolate = interpolateGradient(gradientColorFrom, gradientColorTo);

  return {
    fromColor: interpolate(index0 / segments),
    toColor: interpolate((index0 + 1) / segments),
  }
}

function calculateArcCircle(index0, segments, radius, startAngle0 = 0, angleLength0 = 2 * Math.PI) {
  // Add 0.0001 to the possible angle so when start = stop angle, whole circle is drawn
  const startAngle = startAngle0 % (2 * Math.PI);
  const angleLength = angleLength0 % (2 * Math.PI);
  const index = index0 + 1;
  const fromAngle = angleLength / segments * (index - 1) + startAngle;
  const toAngle = angleLength / segments * index + startAngle;
  const fromX = radius * Math.sin(fromAngle);
  const fromY = -radius * Math.cos(fromAngle);
  const realToX = radius * Math.sin(toAngle);
  const realToY = -radius * Math.cos(toAngle);

  // add 0.005 to start drawing a little bit earlier so segments stick together
  const toX = radius * Math.sin(toAngle + 0.005);
  const toY = -radius * Math.cos(toAngle + 0.005);

  return {
    fromX,
    fromY,
    toX,
    toY,
    realToX,
    realToY,
  };
}

function getGradientId(index) {
  return `gradient${index}`;
}

export default class CircularSlider extends PureComponent {

  static propTypes = {
    onUpdate: PropTypes.func.isRequired,
    startAngle: PropTypes.number.isRequired,
    angleLength: PropTypes.number.isRequired,
    segments: PropTypes.number,
    strokeWidth: PropTypes.number,
    radius: PropTypes.number,
    gradientColorFrom: PropTypes.string,
    gradientColorTo: PropTypes.string,
    showClockFace: PropTypes.bool,
    clockFaceColor: PropTypes.string,
    bgCircleColor: PropTypes.string,
    stopIcon: PropTypes.element,
    startIcon: PropTypes.element,
    textBgCircleColor:PropTypes.string,
    textCircleStrokeColor:PropTypes.string,
    centerCircleText:PropTypes.string,
    sickBar:PropTypes.bool,
    famishedBar:PropTypes.bool,
    touchRelease:PropTypes.func
  }

  static defaultProps = {
    segments: 5,
    strokeWidth: 40,
    radius: 145,
    gradientColorFrom: '#ff9800',
    gradientColorTo: '#ffcf00',
    clockFaceColor: '#9d9d9d',
    bgCircleColor: '#171717',
    textBgCircleColor:'white',
    touchRelease:false
  }

  state = {
    circleCenterX: false,
    circleCenterY: false,

  }

  componentWillMount() {
    this._sleepPanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => this.setCircleCenter(),
      onPanResponderMove: (evt, { moveX, moveY }) => {
        const { circleCenterX, circleCenterY } = this.state;
        const { angleLength, startAngle, onUpdate } = this.props;

        const currentAngleStop = (startAngle + angleLength) % (2 * Math.PI);
        let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI/2;

        if (newAngle < 0) {
          newAngle += 2 * Math.PI;
        }

        let newAngleLength = currentAngleStop - newAngle;

        if (newAngleLength < 0) {
          newAngleLength += 2 * Math.PI;
        }
        this.props.touchRelease(false);

        onUpdate({ startAngle: newAngle, angleLength: newAngleLength % (2 * Math.PI) });
      },
      onPanResponderRelease: (evt, gestureState) =>{this.props.touchRelease(true)},
    });

    this._wakePanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => this.setCircleCenter(),
      onPanResponderMove: (evt, { moveX, moveY }) => {
        const { circleCenterX, circleCenterY } = this.state;
        const { angleLength, startAngle, onUpdate } = this.props;

        let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI/2;
        let newAngleLength = (newAngle - startAngle) % (2 * Math.PI);

        if (newAngleLength < 0) {
          newAngleLength += 2 * Math.PI;
        }

        onUpdate({ startAngle, angleLength: newAngleLength });
      },
      onPanResponderRelease: (evt, gestureState) =>{this.props.touchRelease(true)},
    });
  }

  onLayout = () => {

    // Band-aid to fix https://github.com/bgryszko/react-native-circular-slider/issues/7
    setTimeout(() => {
      this.setCircleCenter();
    }, 100);
  }

  setCircleCenter = () => {
    this._circle.measure((x, y, w, h, px, py) => {
      const halfOfContainer = this.getContainerWidth() / 2;
      this.setState({ circleCenterX: px + halfOfContainer, circleCenterY: py + halfOfContainer });
    });
  }

  getContainerWidth() {
    const { strokeWidth, radius } = this.props;
    return strokeWidth + radius * 2 + 20;
  }

  render() {
    const { startAngle, angleLength, segments, strokeWidth, radius, gradientColorFrom, gradientColorTo, bgCircleColor,
      showClockFace, clockFaceColor, startIcon, stopIcon,textBgCircleColor,textCircleStrokeColor,centerCircleText,sickBar,famishedBar} = this.props;
    const satisfied = (centerCircleText.toLowerCase() == 'satisfied' && Platform.OS != 'ios') ? "0 0 0 0 0 0 -9 12" : "0";
    const containerWidth = this.getContainerWidth();

    const start = calculateArcCircle(0, segments, radius, startAngle, angleLength);
    const stop = calculateArcCircle(segments - 1, segments, radius, startAngle, angleLength);

    return (
      <View style={{ width: (Platform.OS === 'ios') ? containerWidth : containerWidth+100 , height: containerWidth+60,alignItems:'center',}} onLayout={this.onLayout}>
       <Svg
          height={containerWidth+50}
          width={(Platform.OS === 'ios') ?containerWidth+50 : containerWidth+100}
          ref={circle => this._circle = circle}
          style={{left:(Platform.OS === 'ios') ? 0 : 30 }}
        >
        <Defs>
            {
              range(segments).map(i => {
                const { fromX, fromY, toX, toY } = calculateArcCircle(i, segments, radius, startAngle, angleLength);
                const { fromColor, toColor } = calculateArcColor(i, segments, gradientColorFrom, gradientColorTo)
                return (
                  // <LinearGradient key={i} id={getGradientId(i)} x1={fromX.toFixed(2)} y1={fromY.toFixed(2)} x2={toX.toFixed(2)} y2={toY.toFixed(2)}>
                  //   <Stop offset="0%" stopColor={fromColor} />
                  //   <Stop offset="1" stopColor={toColor} />
                  // </LinearGradient>
                  <LinearGradient key={i} id={getGradientId(i)} x1={fromX.toFixed(2)} y1={fromY.toFixed(2)} x2={toX.toFixed(2)} y2={toY.toFixed(2)}>
                    <Stop offset="0%" stopColor={'#e1e5e8'} />
                    <Stop offset="1" stopColor={'#e1e5e8'} />
                  </LinearGradient>
                )
              })
            }

                  <LinearGradient id="yelgre" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#d98352"/>
                    <Stop offset="100%" stopColor="#ee7d43"/>
                  </LinearGradient>
                  <LinearGradient id="blumag" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#0000ff"/>
                    <Stop offset="100%" stopColor="#ff00ff"/>
                  </LinearGradient>
                  <LinearGradient id="magred" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="50%" stopColor="#e9c435"/>
                  <Stop offset="100%" stopColor="#e9c435"/>
                  </LinearGradient>

          </Defs>

          {/*
            ##### Circle
          */}

          <G transform={{ translate: `${strokeWidth/2 + radius + 1}, ${strokeWidth/2 + radius + 1}` }}>


            <Circle
              cx="30"
              cy="70"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke={bgCircleColor}
              strokeDasharray="950"
              strokeDashoffset='-300.292'





            />
            <Circle
              cx="30"
              cy="70"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke={bgCircleColor}
              strokeDasharray="660"
              strokeDashoffset='-800.292'





            />
            {
              famishedBar && (
                <G>

            <Circle
              cx="30"
              cy="70"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke={'url(#magred)'}
              strokeDasharray="370.48"
              strokeDashoffset='-300'
            />
            <Circle
              cx="30"
              cy="70"
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke={bgCircleColor}
              strokeDasharray="670"
              strokeDashoffset='-520'
            />
            </G>

            )
          }
          {
            sickBar && (
          <Circle
            cx="30"
            cy="70"
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke={'url(#yelgre)'}
            strokeDasharray="660"
            strokeDashoffset='-800'
          />
            )
          }


          {/*  <G fill="none"  strokeWidth="15" transform={{translate:(0,30)}}>
          <Path  d="M -126.6,50 A 100,120 0 0,1 -86.6,-50" stroke="url(#blumag)"/>

         </G>*/}
            {/*
              sickBar && (
                <G fill="none"  strokeWidth="15" transform={{translate:(180,70)}}>
                    <Path x="-8" y="-10"   d="M 76.6,-75 A 100,120 0 0,1 86.6,90" stroke="url(#yelgre)"/>

                </G>
                )
              */}

            <G fill="none" strokeWidth="50" >
             <Path x="30" y="60"  d="M 0,-100 A 100,100 0 0,1 86.6,-50" stroke="#c4c4c4"/>
             <Path x="30" y="60" d="M -86.6,-50 A 100,100 0 0,1 0,-100" stroke="#c4c4c4"/>
           </G>
            {/*
            <Circle
              cx="30"
              cy="70"
              r={115 }
              fill="transparent"
              stroke={'#c4c2c2'}
              strokeWidth="35"
            />*/}
            {/* Text Circle */}


            <Circle
              cx="30"
              cy="70"
              r={(strokeWidth + 50) }
              fill={textBgCircleColor}
              stroke={textCircleStrokeColor}
              strokeWidth="15"
            />
            <Text
              x="30"
              y="50"
              textAnchor="middle"
              fontSize="20"
              fill="black"
              ><TSpan dx={satisfied} fontSize="20">{centerCircleText}</TSpan></Text>
            {
              showClockFace && (
                <ClockFace
                  r={radius - strokeWidth / 2}
                  stroke={clockFaceColor}
                />
              )
            }
            {
              range(segments).map(i => {
                const { fromX, fromY, toX, toY } = calculateArcCircle(i, segments, radius, startAngle, angleLength);
                const d = `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} A ${radius} ${radius} 0 0 1 ${toX.toFixed(2)} ${toY.toFixed(2)}`;

                return (
                  <Path
                    d={d}
                    key={i}
                    strokeWidth={strokeWidth}
                    //stroke={`url(#${getGradientId(i)})`}
                    storke={'transparent'}
                    fill="transparent"
                  />
                )
              })
            }

            {/*
              ##### Stop Icon
            */}

            <G
              fill={gradientColorTo}
              transform={{ translate: `${stop.toX}, ${stop.toY}` }}
              onPressIn={() => this.setState({ angleLength: angleLength + Math.PI / 2 })}
              {...this._wakePanResponder.panHandlers}
            >
              <Circle
                cx="30"
                cy="70"
                r={(strokeWidth - 1) / 2}
                fill={bgCircleColor}
                stroke={gradientColorTo}
                strokeWidth="10"
              />
              {
                stopIcon
              }
            </G>

            {/*
              ##### Start Icon
            */}

            <G
              fill={gradientColorFrom}
              transform={{ translate: `${start.fromX}, ${start.fromY}` }}
              onPressIn={() => this.setState({ startAngle: startAngle - Math.PI / 2, angleLength: angleLength + Math.PI / 2 })}
              {...this._sleepPanResponder.panHandlers}
            >
              <Circle
                cx="30"
                cy="70"
                r={(strokeWidth - 1) / 2}
                fill={bgCircleColor}
                stroke={gradientColorFrom}
                strokeWidth="30"
              />
              {
                startIcon
              }
            </G>
          </G>
        </Svg>
      </View>
    );
  }
}
