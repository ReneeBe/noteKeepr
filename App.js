import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { StyleSheet, Text, View, Button, Image, AccessibilityInfo } from 'react-native';
import { GOOGLE_CLOUD_VISION_API_KEY } from './secrets';

const API_KEY = GOOGLE_CLOUD_VISION_API_KEY;
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

async function callGoogleVisionAsync(image) {
  const body = {
    requests: [
      {
        image: {
          content: image,
        },
        features: [
          // {
          //   type: 'LABEL_DETECTION',
          //   maxResults: 1,
          // },
          { type: "TEXT_DETECTION", maxResults: 5 },
          // { type: "DOCUMENT_TEXT_DETECTION", maxResults: 5 },
        ],
      },
    ],
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    // headers: {
    //   Accept: 'application/json',
    //   'Content-Type': 'application/json',
    // },
    body: JSON.stringify( body )
  });

  const result = await response.json();

  const pairedDownAllWords = result.responses[0].fullTextAnnotation.pages[0].blocks[0].paragraphs[0].words;

  
  function wordBuilder (arr) {
    return arr.reduce((acc, letterObj) => {
      return acc.concat(letterObj.text);
    }, []).join('');
  }

  let theWords = '';

  const textBuilder = (ar) => {
    for (let i = 0; i < ar.length; i++) {
      theWords += wordBuilder(ar[i].symbols) + ' ';
    }
    return theWords
  }

  let answer = textBuilder(pairedDownAllWords)

  const allTheWords = [];

  return answer;
}

export default function App() {
  const [image, setImage] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [permissions, setPermissions] = React.useState(false);

  const askPermissionsAsync = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    } else {
      setPermissions(true);
    }
  };
  
  const takePictureAsync = async () => {
    const { cancelled, uri, base64 } = await ImagePicker.launchCameraAsync({
      base64: true,
    });

    if (!cancelled) {
      setImage(uri);
      setStatus('Loading...');
      try {
        
        const result = await callGoogleVisionAsync(base64);
        setStatus(result);

      } catch (error) {
        setStatus(`Error: ${error.message}`);
      }
    } else {
      setImage(null);
      setStatus(null);
    }
  };


  return (
    <View style={styles.container}>
      {permissions === false ? (
        <Button onPress={askPermissionsAsync} title="Ask permissions" />
      ) : (
        <>
          {image !== null && <Image style={styles.image} source={{ uri: image }} />}
          {status !== null && <Text style={styles.text}>{status}</Text>}
          <Button onPress={takePictureAsync} title="Take a Picture" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
