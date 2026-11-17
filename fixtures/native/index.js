import {registerRootComponent} from 'expo';
import React, {useState} from 'react';
import {ScrollView, Text, View, Pressable} from 'react-native';
import * as icons from '@bloxwap/icons/native';
import manifest from '@bloxwap/icons/manifest';
const loaded = new Set();
function App() {
  const [count, setCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [dark, setDark] = useState(true);
  const color = dark ? '#00c853' : '#a000d0';
  return <ScrollView style={{flex:1,backgroundColor:dark?'#111':'#fff'}} contentContainerStyle={{padding:24,paddingTop:70}}>
    <Text style={{fontSize:24,color:dark?'white':'black'}}>Bloxwap icons</Text>
    <Text testID="decode-result" style={{fontSize:16,color}}>{count}/{manifest.icons.length} decoded · {errors.length} errors</Text>
    <Text testID="theme-result" style={{color}}>{dark ? 'Dark theme' : 'Light theme'}</Text>
    <Pressable accessibilityRole="button" onPress={()=>setDark(!dark)} style={{paddingVertical:16}}><Text style={{color}}>Switch theme</Text></Pressable>
    {errors.map(error=><Text key={error} style={{color:'red'}}>{error}</Text>)}
    <View style={{flexDirection:'row',flexWrap:'wrap'}}>{manifest.icons.map(({name,symbol})=>{
      const Icon=icons[symbol];
      return <View key={name} style={{width:'25%',height:85,alignItems:'center',gap:8}}>
        <Icon size={28} color={color} accessibilityLabel={name} onError={event=>{setErrors(previous=>[...previous,`${name}: ${event.error}`]);console.error('ICON_DECODE_ERROR',name,event.error);}} onLoad={()=>{loaded.add(name);setCount(loaded.size);if(loaded.size===manifest.icons.length)console.log('ICONS_VERIFIED',loaded.size);}}/>
        <Text style={{fontSize:9,textAlign:'center',color:dark?'#aaa':'#555'}}>{name}</Text>
      </View>;
    })}</View>
  </ScrollView>;
}
registerRootComponent(App);
