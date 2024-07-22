import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const HomeScreen = () => {

  // Get the current time
  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting;
  // Determine the greeting based on the time
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentTime.toLocaleDateString(undefined, dateOptions);

  return (
    <View style={styles.container}>
        <View style={styles.topheader}>
          {/* Date and Greetings */}
          <View style={styles.dateGreetingsContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.greetings}>{greeting}</Text>
          </View>
        </View>
   </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    bottom: '0%'
  },
  topheader: {
    flex: 1,
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    bottom: '85%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#0B3954', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dateGreetingsContainer: {
    alignItems: 'flex-start',
    flex: 1,
    marginHorizontal: 10,
    marginTop: 25,
  },
  date: {
    color: 'white',
    fontSize: 13,
  },
  greetings: {
    color: 'white',
    paddingTop:10,
    fontSize: 25,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
