/**
 * Created by yzw on 2016/10/13.
 */
/**
 * Created by yzw on 16/9/26.
 */


import React, {Component} from 'react';
import {
    Image,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ProgressViewIOS,
    ProgressBarAndroid
} from 'react-native';
// import * as Progress from 'react-native-progress';
var PropTypes = require('react/lib/ReactPropTypes');

import RNFS, { DocumentDirectoryPath } from 'react-native-fs';
const URL = require('url-parse');
const MD5 = require("crypto-js/md5");


class ProgressBar extends Component {
    
    static propTypes = {
    progressProps: PropTypes.object,
    color:PropTypes.string,
    iosTrackTintColor:PropTypes.string,
    progress:PropTypes.number,
    }
    static defaultProps = {
    color:'gray',
    iosTrackTintColor:'gray',
    progress:0,
    };
    
    
    render() {
        
        if(Platform.OS === 'android'){
            return <ProgressBarAndroid color={this.props.color} progress={this.props.progress} {...this.props.progressProps}/>
        }
        else  if(Platform.OS === 'ios') {
            return <ProgressViewIOS  progressTintColor={this.props.color} trackTintColor={this.props.iosTrackTintColor}  progress={this.props.progress}  {...this.props.progressProps}/>
        }
    }
}

export default class MKPLoadImageView extends Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
        cachedImagePath:null,
        animating: props.imageSource ? true : false,
        defaultImageSource: props.defaultImageSource ? props.defaultImageSource : require('../assets/icon.png'),
        imageSource: props.imageSource ? props.imageSource : require('../assets/icon.png'),
        isLoalImage:PropTypes.bool, //是否是本地图片
        cacheable:false,
        }
    }
    
    
    clearImageCache(url){
        
        const dirPath = this.fileDirectory();
        const filePath = this.fullFilePath(this.fileName(url));
        
        RNFS.exists(filePath).then((haveFile) => {
                                   if (haveFile) {
                                   RNFS.exists(filePath).then((res) => {
                                                              if (res) {
                                                              RNFS.unlink(filePath).catch((err) => {});
                                                              }
                                                              });
                                   }
                                   })
    }
    
    static propTypes = {
        ...Image.propTypes,
    defaultImageSource: PropTypes.oneOfType([PropTypes.shape({
                                                             uri: PropTypes.string,
                                                             }),
                                             PropTypes.number,
                                             PropTypes.arrayOf(
                                                               PropTypes.shape({
                                                                               uri: PropTypes.string,
                                                                               width: PropTypes.number,
                                                                               height: PropTypes.number,
                                                                               }))
                                             ]),
    imageSource: PropTypes.oneOfType([PropTypes.shape({ uri: PropTypes.string, }),
                                      PropTypes.number,
                                      PropTypes.arrayOf( PropTypes.shape({
                                                                        uri: PropTypes.string,
                                                                        width: PropTypes.number,
                                                                        height: PropTypes.number,
                                                                        }))
                                      ]),
    style: PropTypes.oneOfType([PropTypes.object,PropTypes.number]),
    onPress: PropTypes.func,
    customIndicator: PropTypes.func,
    indicatorType:PropTypes.oneOf(['circle','line']),//默认是circle类型
    indicatorProps: PropTypes.object,
    data: PropTypes.any ,//点击事件，数据传输
    loadCallBack:PropTypes.func,
    hiddenProgress:PropTypes.bool,
    clearCaheWillUnmount:PropTypes.bool
    }
    
    static defaultProps = {
    progress:0,
    hiddenProgress:false,
    showLoading: true,
    indicatorType:'circle',
    style: {backgroundColor: 'white'}
    };
    
    componentWillReceiveProps(nextProps) {
        console.log('');
        let newState = Object.assign({}, this.state);
        if (nextProps.defaultImageSource) {
            newState.defaultImageSource = nextProps.defaultImageSource;
        }
        if (nextProps.imageSource) {
            newState.animating = true;
        }
        else {
            newState.animating = false;
        }
        
        this.setState(newState);
    }
    
    
    fileName(aurl){
        const url = new URL(aurl);
        const type = url.pathname.replace(/.*\.(.*)/, '$1');
        return MD5(url)+'.'+type
    }
    
    fileDirectory(){
        return DocumentDirectoryPath+'/CacheImage'
    }
    fullFilePath(fileName){
        return this.fileDirectory()+'/'+fileName;
    }
    
    getImageContent(source,fileName){
        
        let fullPath = this.fullFilePath(fileName);
        
        console.log('fullPath = ',fullPath)
        RNFS.stat(fullPath).then((result)=>{
                                 
                                 
                                 if(result.isFile()){//存在文件
                                 this.handleLonLoadEnd()
                                 this.setState({cacheable: true, imageSource: fullPath});
                                 }
                                 }).catch(()=> {
                                          
                                          RNFS.mkdir(this.fileDirectory(), {NSURLIsExcludedFromBackupKey: true}).then(() => {
                                                                                                                      let downloadOptions = {
                                                                                                                      fromUrl: source.uri,
                                                                                                                      toFile: fullPath,
                                                                                                                      background: true,
                                                                                                                      begin: this.handleStart.bind(this),
                                                                                                                      progress: this.handleProgress.bind(this)
                                                                                                                      };
                                                                                                                      
                                                                                                                      RNFS.downloadFile(downloadOptions)
                                                                                                                      this.setState({cacheable: true, imageSource: fullPath});
                                                                                                                      
                                                                                                                      }).catch((err) => {
                                                                                                                               this.setState({cacheable: false, imageSource: null});
                                                                                                                               })
                                          })
    }
    
    
    analysisSource(source){
        if (source !== null
            && typeof source === "object"
            && source.hasOwnProperty('uri')) {
            
            const url = new URL(source.uri);
            const type = url.pathname.replace(/.*\.(.*)/, '$1');
            
            let fileName = this.fileName(source.uri);
            this.getImageContent(source,fileName);
            this.setState({isLoalImage: false});
        }
        else {
            this.setState({isLoalImage: true});
        }
    }
    
    componentWillMount() {
        this.analysisSource(this.state.imageSource.uri)
    }
    componentWillUnmount() {
        if(this.props.clearCaheWillUnmount) {
            this.clearImageCache(this.props.imageSource.uri)
        }
    }
    
    
    async handleStart(){
        let newState = Object.assign({}, this.state);
        newState.animating = true;
        newState.progress = 0;
        this.setState(newState);
        if(this.props.loadCallBack){
            this.props.loadCallBack(0);
        }
    }
    
    async handleProgress(event){
        
        let progress =  (event.bytesWritten / event.contentLength )
        
        if(progress<1) {
            let newState = Object.assign({}, this.state);
            newState.progress = progress;
            this.setState(newState);
            if (this.props.loadCallBack) {
                this.props.loadCallBack(progress);
            }
        }
        else{
            let newState = Object.assign({}, this.state);
            newState.progress = 1;
            newState.animating = false;
            this.setState(newState);
            if (this.props.loadCallBack) {
                this.props.loadCallBack(1);
            }
        }
        
    }
    
    handleLonLoadEnd(){
        
        let newState = Object.assign({}, this.state);
        newState.animating = false;
        newState.progress = 1;
        newState.defaultImageSource = require('../assets/icon.png');
        this.setState(newState);
        if(this.props.loadCallBack){
            this.props.loadCallBack(1);
        }
    }
    
    clickHandle() {
        if (this.props.onPress) {
            this.props.onPress(this.props.data)
        }
    }
    
    renderCache(props) {
        return (
                <Image {...this.props}
                style={this.props.style}
                source={this.props.imageSource}
                blurRadius={this.props.blurRadius}
                resizeMode={this.props.resizeMode}
                
                >
                {!this.props.customIndicator && !this.props.hiddenProgress && this.props.indicatorType==='circle' && this.state.animating && <ActivityIndicator size="small"
                progress={this.state.progress} {...this.props.indicatorProps}/>}
                {!this.props.customIndicator && !this.props.hiddenProgress && this.props.indicatorType==='line' && this.state.animating && <ProgressBar color="red" progress={this.state.progress}
                progressProps ={this.props.indicatorProps}/>}
                
                {this.props.customIndicator && !this.props.hiddenProgress && this.state.animating && <this.props.customIndicator progress={this.state.progress} {...this.props.indicatorProps}/>}
                {this.props.children}
                </Image>
                );
    }
    
    renderLocal(props){
       
        return  <Image 
        style={this.props.style}
        source={this.props.imageSource}
        blurRadius={this.props.blurRadius}
        
        {...this.props}
        >
        {this.props.children}
        </Image>
    }
    
    render() {
        let props = {};
        props.resizeMethod = this.props.resizeMethod;
        props.resizeMode = this.props.resizeMode;
        
        var imageComponent = <Image {...props}
        style={this.props.style}
        source={this.state.defaultImageSource}
        blurRadius={this.props.blurRadius}
        resizeMode={this.props.resizeMode}/>

 

        if(this.props.imageSource && this.state.isLoalImage){
            imageComponent = this.renderLocal(this.props);
        }
        else if(this.props.imageSource && !this.state.isLoalImage ){
            imageComponent = this.renderCache(this.props);
        }
        return <View style={{flex:1}}>
        
        {imageComponent}
        </View>
        
    }
    
    
};
