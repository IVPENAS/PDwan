import { Text, TouchableOpacity, View, StyleSheet, ScrollView, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Circle, Svg } from 'react-native-svg';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); //Recording Status
  const [audioPermission, setAudioPermission] = useState(null);  //Recording Permision
  const [recordingsList, setRecordingsList] = useState([]); //Recording List
  const animatedValue = useRef(new Animated.Value(0)).current; // Reference to animated value
  const animatedOpacityCircle2 = useRef(new Animated.Value(0)).current; //Opacity Animation - Circle 2
  const animatedOpacityAnimatedCircle = useRef(new Animated.Value(0)).current; //Opacity Animation - Animated Circle


  //Permission
  useEffect(() => {
    //Recording Permision 
    async function getPermission() {
      await Audio.requestPermissionsAsync().then((permission) => {
        console.log('Permission Granted: ' + permission.granted);
        setAudioPermission(permission.granted)
      }).catch(error => {
        console.log(error);
      });
    }
    getPermission()
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  //Animation of Circle
  useEffect(() => {
    const circumference = 30 * 2 * Math.PI;

    if (recordingStatus === 'recording') {
      Animated.timing(animatedValue, {
        toValue: circumference,
        duration: 30995, //30 seconds - added slight delay for the animation
        useNativeDriver: true
      }).start();
    } else {
      //Reset Animation - Stopping Recording
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      }).start();
    }
  }, [recordingStatus]);

    //Reset Animation - 30 secs
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

    /* Opacity Recording - Idle */
    useEffect(() => {
      if (recordingStatus === 'idle' && elapsedTime === 0) {
        // Ending - End of Recording
        Animated.parallel([
          Animated.timing(animatedOpacityCircle2, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedOpacityAnimatedCircle, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (recordingStatus === 'recording') {
        // Opening - Start of Recording
        Animated.parallel([
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
        ]).start();
      }
    }, [recordingStatus, elapsedTime]);


  //Start Recording
  async function startRecording() {
    try {
      /* Permission */
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        })
      }
      /* Creating new Audio Record */
      const newRecording = new Audio.Recording();
      console.log('Starting Recording')

      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');
      setElapsedTime(0); // Reset timer
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  //Stop Recording
  async function stopRecording() {
    try {
      if (recordingStatus === 'recording') {
        console.log('Stopping Recording')
        await recording.stopAndUnloadAsync();

        const recordingUri = recording.getURI(); //Fetching Recorded Audio
        const ordinalNumber = recordingsList.length + 1; //Ordinal Numbering per Audio File
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

      {/*Circle 1*/}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
        <Circle 
        cx="50" 
        cy="20" 
        r="30" 
        fill="none" 
        stroke="#0B3954" 
        strokeWidth="8"/>
      </Svg>

      {/* Circle 2 */}
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer}>
      <AnimatedCircle
        cx="50"
        cy="20"
        r="30"
        fill="none"
        stroke="#E7E7E7"
        strokeWidth="3"
        opacity={animatedOpacityCircle2}
      />
      </Svg>

    {/* Animated Circle */}
    <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svgContainer} >
      <AnimatedCircle
        cx="20"
        cy="50"
        r="30"
        fill="none"
        stroke="#FF9700"
        strokeWidth="3"
        strokeDasharray={`${30 * 2 * Math.PI}`}
        strokeDashoffset={animatedValue}
        strokeLinecap='round'
        transform="rotate(-270, 50, 50)"
        opacity={animatedOpacityAnimatedCircle}
      />
    </Svg>

      <View style = {styles.playbackContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
        <FontAwesome5 name={recording ? 'stop-circle' : 'circle'} size={44} color="white" />
      </TouchableOpacity>
      
      </View>


      {/* Record Button */}
      

    </View>
  );
}
const AnimatedCircle = Animated.createAnimatedComponent(Circle); //Circle Animation

const styles = StyleSheet.create({
container: {
flex: 1,
},
/* Recording */
button: {
alignItems: 'center',
justifyContent: 'center',
width: 65,
height: 65,
borderRadius: 64,
backgroundColor: "#0B3954",
},
svgContainer: {
  position: 'absolute', // Make SVG position absolute to float over other components
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
},
});