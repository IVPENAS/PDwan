import { Text, TouchableOpacity, View, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome5 } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Circle, Svg } from 'react-native-svg';
import smol from '../assets/smollogo.png';

export default function App({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // Recording Status
  const [audioPermission, setAudioPermission] = useState(null);  // Recording Permission
  const [recordingsList, setRecordingsList] = useState([]); // Recording List
  const [elapsedTime, setElapsedTime] = useState(0); // Added for timer 
  const [animationComplete, setAnimationComplete] = useState(false); // Track animation completion
  const animatedValue = useRef(new Animated.Value(0)).current; // Reference to animated value
  const animatedOpacityCircle2 = useRef(new Animated.Value(0)).current; // Opacity Animation - Circle 2
  const animatedOpacityAnimatedCircle = useRef(new Animated.Value(0)).current; // Opacity Animation - Animated Circle
  const rippleAnimation = useRef(new Animated.Value(0)).current; // Ripple Animation
  const [showProcessing, setShowProcessing] = useState(false); // 'processing' text animation

  const goToLandingPage = () => {
    navigation.navigate('LandingPage');
  };
  const goToLoadingAuth = () => {
    navigation.navigate('LoadingAuth');
  };
  const goToVoiceAuthen = () => {
    navigation.navigate('VoiceAuthen');
  };
  
  // Permission
  useEffect(() => {
    async function getPermission() {
      await Audio.requestPermissionsAsync().then((permission) => {
        console.log('Permission Granted: ' + permission.granted);
        setAudioPermission(permission.granted);
      }).catch(error => {
        console.log(error);
      });
    }
    getPermission();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  // Animation of Circle
  useEffect(() => {
    const circumference = 30 * 2 * Math.PI;

    if (recordingStatus === 'idle' && elapsedTime === 0 && recordingsList.length > 0) {
      // Stopping Recording - Start Animation
      setAnimationComplete(false); // Reset animation complete state
      setShowProcessing(true); // Show 'processing' text during animation
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: circumference,
          duration: 5000, // 30 seconds animation speed
          useNativeDriver: true
        }),
        Animated.timing(animatedOpacityCircle2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacityAnimatedCircle, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationComplete(true); // Set animation complete after animation ends
        setShowProcessing(false); // Hide 'processing' text after animation ends
      });
    } else if (recordingStatus === 'recording') {
      // Reset Animation - Starting Recording
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(animatedOpacityCircle2, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacityAnimatedCircle, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [recordingStatus, elapsedTime, recordingsList.length]);

  // Reset Animation - 30 secs
  useEffect(() => {
    let timer;
    if (recordingStatus === 'recording') {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime < 30) {
            return newTime;
          } else {
            clearInterval(timer);
            stopRecording();
            return 30;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recordingStatus]);

  /* Ripple Animation */
  useEffect(() => {
    if (recordingStatus === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rippleAnimation.stopAnimation();
    }
  }, [recordingStatus]);

  // Redirect to LandingPage after 5 seconds
  useEffect(() => {
    let redirectTimer;
    if (!recording && animationComplete) {
      redirectTimer = setTimeout(() => {
        navigation.navigate('VoiceAuthen');
      }, 5000); // 5 seconds delay
    }
    return () => clearTimeout(redirectTimer);
  }, [recording, animationComplete]);

  // Start Recording
  async function startRecording() {
    try {
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
      }
      const newRecording = new Audio.Recording();
      console.log('Starting Recording');

      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');
      setElapsedTime(0); // Reset timer
      
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  // Stop Recording
  async function stopRecording() {
    try {
      if (recordingStatus === 'recording') {
        console.log('Stopping Recording');
        await recording.stopAndUnloadAsync();

        const recordingUri = recording.getURI(); // Fetching Recorded Audio
        const ordinalNumber = recordingsList.length + 1; // Ordinal Numbering per Audio File
        const fileName = `record audio - ${ordinalNumber}`;

        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        const filePath = FileSystem.documentDirectory + 'recordings/' + fileName;

        await FileSystem.moveAsync({
          from: recordingUri,
          to: filePath
        });
        setRecordingsList(prevRecordings => [...prevRecordings, {
          uri: filePath,
          name: fileName,
        }]);

        setRecording(null);
        setRecordingStatus('idle'); // Set status back to idle
        setElapsedTime(0); // Reset timer
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }
  
  async function handleRecordButtonPress() {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  return (
    <View style={styles.container}>
      <Image source={smol} style={styles.logo} />
      <View style={styles.titleContainer}>
        <Text style={styles.journalTitle}>Authenti</Text>
        <Text style={styles.journalTitlesub}>Check</Text>
      </View>

      <Text style={styles.descHeader}>Audio Capture</Text>
      <Text style={styles.desc}>Press the record button for voice authenticator</Text>

      {/* Circle 2 */}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <AnimatedCircle
          cx="50"
          cy="83"
          r="30"
          fill="transparent"
          stroke="#0B3954"
          strokeWidth="3"
          opacity={animatedOpacityCircle2}
        />
      </Svg>

      {/* Animated Circle */}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <AnimatedCircle
          cx="83"
          cy="50"
          r="30"
          fill="transparent"
          stroke="#FF9700"
          strokeWidth="3"
          strokeDasharray={`${30 * 2 * Math.PI}`}
          strokeDashoffset={animatedValue}
          transform="rotate(-270, 50, 50)"
          opacity={animatedOpacityAnimatedCircle}
        />
      </Svg>

      
      <View style={styles.playbackContainer}>
        {/* Ripple Effect */}
        <Animated.View style={[styles.ripple, {
          opacity: rippleAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 0],
          }),
          transform: [
            {
              scale: rippleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              }),
            },
          ],
        }]} />

        {/* Record Button */}
        <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
          <FontAwesome5 name={recording ? 'stop-circle' : 'circle'} size={90} color="white" />
        </TouchableOpacity>
      </View>

        {/* Animation Fedinout text - Processing */}
        {showProcessing && (
        <View style={styles.titleContainer}>
          <Text style={styles.descOutput4}>「 Processing Audio 」</Text>
        </View>
      )}
 

        {/* Animation Fadeinout text - After 30 sec processing */}
        {!recording && animationComplete && (
        <View style={styles.titleContainer}>
          <Text style={styles.descOutput}>Authenticity : </Text>
          <Text style={styles.descOutput2}>Human-generated</Text>
        </View>
        )}

        {/* Animation Fadeinout text - After 30 sec processing*/}
        {!recording && animationComplete && (
        <View style={styles.titleContainer}>
          <Text style={styles.descOutput3}>Redirecting to the Main Menu after 5-seconds</Text>
        </View>
        )}

        
        
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle); // Circle Animation

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  /* Recording */
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 127,
    width: 158,
    height: 158,
    borderRadius: 100,
    backgroundColor: "#0B3954",
    position: 'absolute',
    top: 200
  },
  svgContainer: {
    position: 'absolute', // Make SVG position absolute to float over other components
  },
  /* Text */
  desc: {
    fontSize: 15,
    color: '#a19c9c',
    textAlign: 'justify',
    marginHorizontal: 20,
    paddingTop: 10,
  },
  descHeader: {
    fontSize: 22,
    fontWeight: '500',
    color: '#a19c9c',
    marginHorizontal: 20,
    paddingTop: 20,
  },
  descOutput: {
    fontSize: 20,
    fontWeight: '500',
    color: '#a19c9c',
    textAlign: 'justify',
  },
  descOutput2: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FF9700',
  },
  descOutput3: {
    fontSize: 15,
    top: -50,
    color: '#a19c9c',
  },
  descOutput4: {
    fontSize: 20,
    fontWeight: '500',
    top: -10,
    color: '#0B3954',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  journalTitlesub: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B3954'
  },
  journalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9700'
  },
  /* Logo */
  logo: {
    top: 50,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: 170 }],
  },
  /* Animation */
  ripple: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: '#0B3954',
    top: 200,
    left: 127,
  },
 });
