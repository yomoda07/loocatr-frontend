import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native'
import ToggleSwitch from 'toggle-switch-react-native'
import topBar from '../images/center-logo2x.png'
import {
  FormLabel,
  FormInput,
  FormValidationMessage,
  CheckBox,
  Button,
  Icon
} from 'react-native-elements'
import DateTimePicker from 'react-native-modal-datetime-picker'
import RNFetchBlob from 'react-native-fetch-blob'
import * as firebase from 'firebase';
import ImagePicker from 'react-native-image-crop-picker'
import axios from 'axios'


export default class BathRoomForm extends Component<{}> {
  constructor() {
    super()
    this.state = {
        location_name: '',
        latitude: 37,
        longitude: 122,
        over_21: false,
        handicapped: false,
        family: false,
        customer_only: false,
        trueSwitchIsOn: true,
        falseSwitchIsOn: false,
        isDateTimePickerVisible: false,
        loading: false,
        imageBlob: null,
        imageName: null,
        uid: 'anonymous',
        timeFrames: [
          {day: 'Monday', start: '', close: ''},
          {day: 'Tuesday', start: '', close: ''},
          {day: 'Wednesday', start: '', close: ''},
          {day: 'Thursday', start: '', close: ''},
          {day: 'Friday', start: '', close: ''},
          {day: 'Saturday', start: '', close: ''},
          {day: 'Sunday', start: '', close: ''}
        ]
    }
  }


  static navigationOptions = {
    headerStyle: {
      position: 'absolute',
      top: 0,
      left: 0
    },
    headerBackTitleStyle: {
        opacity: 0,
    },
    headerTintColor: '#fff'
  };


  _showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });

  _hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

  _handleDatePicked = (date, index) => {
    console.log(`index: ${index}`);
    console.log(`date: ${date}`);
    const dateTime = new Date(date);
    let hours = dateTime.getHours();
    if (hours < 10) {
      hours = '0' + hours
    }
    let minutes = dateTime.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    console.log(`${index}: ${hours}${minutes}`);
    this._hideDateTimePicker();
  };

  openPicker(){
    this.setState({ loading: true })
    const Blob = RNFetchBlob.polyfill.Blob;
    const fs = RNFetchBlob.fs;
    window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
    window.Blob = Blob;
    ImagePicker.openPicker({
      width: 300,
      height: 250,
      cropping: true,
      mediaType: 'photo'
    }).then(image => {
      this.setState({ imageName: image.filename })
      const imagePath = image.path;
      let mime = 'image/jpg';
      const imageBlob = fs.readFile(imagePath, 'base64')
        .then((data) => {
          return Blob.build(data, { type: `${mime};BASE64` });
      })
      this.setState({ imageBlob });
      this.setState({ loading: false });
    })
    .catch((error) => {
      this.setState({ loading: false });
    })
  }

  uploadImage(bathroomId) {
    let uploadBlob = null;
    let mime = 'image/jpg';
    const imageRef = firebase.storage().ref(this.props.uid).child(this.state.imageName);
    this.state.imageBlob
    .then((blob) => {
        uploadBlob = blob;
        return imageRef.put(blob, { contentType: mime });
      })
      .then(() => {
        uploadBlob.close();
        return imageRef.getDownloadURL();
      })
      .then((url) => {
        axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        axios.post(`https://obscure-tor-64284.herokuapp.com/bathrooms/${bathroomId}/images`,  {
          image_url: url
        }).then((response) => {
          this.props.navigation.navigate('Info', { id: response.data.bathroom_id.toString() })
        })
        this.setState({ imageBlob: null });
        this.setState({ imageName: null });
      })
      .catch((error) => {
        console.log(error);
      })
  }

  // following 2 functions can be more DRY:
  updateLocationName(locationName) {
    this.setState({ location_name: locationName });
  }

  updateAddress(address) {
    this.setState({ address: address });
  }

  toggleAccessibilityState(state, option) {
    var updateState = {}
    updateState[state] = option

    this.setState(updateState)
  }

  geolocateAddress(address) {
    var geolocationLat
    var geolocationLng

    axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDvzsWpabMDZzoKw5hpo5RODzQhqzE4dhg&address=${address}`)
    .then(response => {
      var geolocationLat = response.data.results[0].geometry.location.lat
      var geolocationLng = response.data.results[0].geometry.location.lng

      this.setState({
        latitude: geolocationLat,
        longitude: geolocationLng
      })
    });
  }

  addBathroom(bathroomData) {
    const { navigate } = this.props.navigation;

    axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    axios.post('https://obscure-tor-64284.herokuapp.com/bathrooms/',  bathroomData)
    .then(response => {
      var bathroomId = response.data.id
      console.log(bathroomId)
      if (this.state.imageBlob) {
        this.uploadImage(bathroomId);
      } else {
        navigate('Info', { id: bathroomId.toString() })
      }
    });
  }

  render() {

    const dps = this.state.loading ? <ActivityIndicator animating={this.state.loading} /> : (
        <View>
          <View>
            <Button
              onPress={ () => this.openPicker() }
              title={ this.state.imageBlob ? this.state.imageName : "Upload photo" }
              backgroundColor='#00BCD4'
            />
          </View>
        </View>
    )


    return (
      <View style={styles.container}>
        <Image
          source={topBar}
          style={styles.topBar}
        />
      <ScrollView>
        <View style={styles.headDiv}>
          <Text style={styles.header}>
            Tell us about this bathroom
          </Text>
        </View>
        <View style={styles.input}>
          <FormLabel>Business Name</FormLabel>
          <FormInput onChangeText={(locationName) => this.updateLocationName(locationName)}/>
        </View>
        <View style={styles.input}>
          <FormLabel>Address</FormLabel>
          <FormInput
          onChangeText={(address) => this.updateAddress(address)}
          onBlur={(address) => this.geolocateAddress(address.nativeEvent.text)}
          />
        </View>
        <View style={styles.section}>
          <Icon
            name='local-bar'
            color='#7a8288'
          />
          <ToggleSwitch
             isOn={false}
             onColor='#3d2d75'
             offColor='grey'
             label='Age restrictions 21+'
             labelStyle={{color: '#7a8288', fontWeight: '900'}}
             size='small'
             onToggle={ (isOn) => this.toggleAccessibilityState('over_21', isOn) }
          />
        </View>
        <View style={styles.section}>
          <Icon
            name='attach-money'
            color='#7a8288'
          />
          <ToggleSwitch
             isOn={false}
             onColor='#3d2d75'
             offColor='grey'
             label='Customer only'
             labelStyle={{color: '#7a8288', fontWeight: '900'}}
             size='small'
             onToggle={ (isOn) => this.toggleAccessibilityState('customer_only', isOn) }
          />
        </View>
        <View style={styles.divider}>
          <Text style={styles.divideText}>
            AMENITIES
          </Text>
        </View>
        <View style={styles.section}>
          <Icon
            name='accessible'
            color='#7a8288'
          />

          <ToggleSwitch
             isOn={false}
             onColor='#3d2d75'
             offColor='grey'
             label='Handicap accessible'
             labelStyle={{color: '#7a8288', fontWeight: '900'}}
             size='small'
             onToggle={ (isOn) => this.toggleAccessibilityState('handicapped', isOn) }
          />
        </View>

        <View style={styles.section}>
          <Icon
            name='child-friendly'
            color='#7a8288'
          />
          <ToggleSwitch
             isOn={false}
             onColor='#3d2d75'
             offColor='grey'
             paddingLeft='10'
             label='Family'
             labelStyle={{color: '#7a8288', fontWeight: '900'}}
             size='small'
             onToggle={ (isOn) => this.toggleAccessibilityState('family', isOn) }
          />
        </View>

        <View style={styles.divider}>
          <Text style={styles.divideText}>
            Hours
          </Text>
        </View>
        {this.state.timeFrames.map((timeFrame, index) => {
          var dayIndex = index;
          return (
            <View key={timeFrame.day} style={styles.section}>
              <Text style={{color: '#7a8288', fontWeight: '900'}}>
                {timeFrame.day}
              </Text>
              <View style={{display: 'flex', flexDirection: 'row'}}>
                <TouchableOpacity onPress={this._showDateTimePicker}>
                  <Text style={styles.openClose}>{index} Open</Text>
                </TouchableOpacity>
                <DateTimePicker
                  mode='time'
                  isVisible={this.state.isDateTimePickerVisible}
                  onConfirm={(data) => this._handleDatePicked(data, dayIndex)}
                  onCancel={this._hideDateTimePicker}
                />
                <TouchableOpacity onPress={this._showDateTimePicker}>
                  <Text style={styles.openClose}>Close</Text>
                </TouchableOpacity>
                <DateTimePicker
                  mode='time'
                  isVisible={this.state.isDateTimePickerVisible}
                  onConfirm={this._handleDatePicked}
                  onCancel={this._hideDateTimePicker}
                />
              </View>
            </View>
          );
        })}
        <View>
           { dps }
        </View>

        <View style={styles.buttonDiv}>
          <Button
            backgroundColor= '#007fff'
            borderRadius= {4}
            fontFamily= 'verdana'
            fontWeight= 'bold'
            raised
            title='Submit Bathroom'


            onPress={() => this.addBathroom(this.state)}
          />
        </View>

    </ScrollView>
    </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'white',
  },
  headDiv: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'lightgrey',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: 'lightgrey'
  },
  header: {
    fontWeight: 'bold',
    fontSize: 22,
    fontFamily: 'verdana'
  },
  divider: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'lightgrey',
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderColor: 'lightgrey'
  },
  divideText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'verdana',
    color: '#7a8288'
  },
  topBar: {
    height: 67,
    width: 375,
  },
  checkBox: {
    padding: 30
  },
  icon: {

  },

  section: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 5,
    borderBottomWidth: 1,
    borderColor: 'lightgrey'
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'lightgrey'
  },
  buttonDiv: {
    backgroundColor: 'lightgrey',
    padding: 30,

  },
  button: {
    backgroundColor: '#007fff',
  },
  openClose: {
    padding: 5,
    backgroundColor: '#3d2d75',
    color: 'white',
    fontWeight: '900',
    borderWidth: 0.5,
    margin: 5

  }
});
