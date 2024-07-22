import { Text, TouchableOpacity, View, StyleSheet, Image, Animated, Easing} from 'react-native';
import React, { useState, useEffect, useRef  } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import smol from '../assets/smollogo.png';

export default function App() {
  
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);

  const rippleAnims = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];


  useEffect(() => {

    // Permission
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

  useEffect(() => {
    if (recordingStatus === 'recording') {
      startRippleAnimation();
    } else {
      stopRippleAnimation();
    }
  }, [recordingStatus]);


  /* Start Record */
  async function startRecording() {
    try {
      // needed for IoS
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        })
      }
      const newRecording = new Audio.Recording();
      console.log('Starting Recording')
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');

    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  /* Stop Recording */
  async function stopRecording() {
    try {

      if (recordingStatus === 'recording') {
        console.log('Stopping Recording')
        await recording.stopAndUnloadAsync();
        const recordingUri = recording.getURI();

        // Create a file name for the recording
        const fileName = `recording-${Date.now()}.caf`;

        // Move the recording to the new directory with the new file name
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        await FileSystem.moveAsync({
          from: recordingUri,
          to: FileSystem.documentDirectory + 'recordings/' + `${fileName}`
        });

        // This is for simply playing the sound back
        const playbackObject = new Audio.Sound();
        await playbackObject.loadAsync({ uri: FileSystem.documentDirectory + 'recordings/' + `${fileName}` });
        await playbackObject.playAsync();

        // resert our states to record again
        setRecording(null);
        setRecordingStatus('stopped');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  async function handleRecordButtonPress() {
    if (recording) {
      const audioUri = await stopRecording(recording);
      if (audioUri) {
        console.log('Saved audio file to', savedUri);
      }
    } else {
      await startRecording();
    }
  }

  const createRippleAnimation = (anim, delay) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  };

  const startRippleAnimation = () => {
    rippleAnims.forEach((anim, index) => {
      createRippleAnimation(anim, index * 400).start();
    });
  };

  const stopRippleAnimation = () => {
    rippleAnims.forEach((anim) => {
      anim.setValue(1);
      anim.stopAnimation();
    });
  };

  return (
    <View style={styles.container}>
      <Image source={smol} style={styles.logo} />


      <View style={styles.titleContainer}>
          <Text style={styles.journalTitle}>Authenti</Text>
          <Text style={styles.journalTitlesub}>Check</Text>
        </View>

        <Text style={styles.descHeader}>Text-Independent Speaker Recognition</Text>
        <Text style={styles.desc}>Press the record button for voice authenticator</Text>

      <View style={styles.recordContainer}>
      <View style={styles.rippleContainer}>
          {rippleAnims.map((anim, index) => (
            <Animated.View key={index} style={[styles.ripple, { transform: [{ scale: anim }] }]} />
          ))}
          <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
            <FontAwesome name={recording ? 'stop-circle' : 'circle'} size={64} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.recordingStatusText}>{`Recording status: ${recordingStatus}`}</Text>
        <Text style={styles.descHeader}>Hey user</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  recordContainer:{
    top: 120,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  desc: {
    fontSize: 15,
    color: '#a19c9c',
    textAlign: 'justify',
    marginHorizontal: 20,
    paddingTop: 10,
  },
  descHeader: {
    fontSize: 20,
    fontWeight: '500',
    color: '#a19c9c',
    marginHorizontal: 20,
    paddingTop: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 158,
    height: 158,
    borderRadius: 100,
    backgroundColor: 'red',
  },
  rippleContainer: {
    width: 158,
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 100,
    backgroundColor: 'red',
    opacity: 0.5,
  },
  recordingStatusText: {
    marginTop: 16,
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
    color:'#0B3954'
  },
  journalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9700'
  },
  logo:{
    top: 50,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateX: 170}],
  }
});