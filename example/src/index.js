import React from 'react';
import { render } from 'react-dom';
import _ from 'lodash';
import {
  Button, Alert, Container, Row, Col, Badge, Jumbotron, ProgressBar,
} from 'react-bootstrap';
import WebUploader from '../../dist';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileList: [],
    };

    this.handleChooseFile = this.handleChooseFile.bind(this);

    this.fileQueued = this.fileQueued.bind(this);
    this.renderFileList = this.renderFileList.bind(this);
    this.uploadProgress = this.uploadProgress.bind(this);
    this.onUploadError = this.onUploadError.bind(this);
  }

  componentDidMount() {

  }

  onUploadError(error) {
    console.log(`当前时间 ${Date.now()}: debug 的数据是 error: `, error);
  }

  handleChooseFile() {
    this.uploader.handleChooseFile();
  }

  beforeSendFile() {

  }

  uploadProgress(file, percentage) {
    const { tempKey } = file;
    let { fileList } = this.state;
    fileList = _.cloneDeep(fileList);
    fileList.find(f => f.tempKey === tempKey).percentage = percentage;

    this.setState({ fileList });
  }

  fileQueued(file) {
    const { fileList } = this.state;
    fileList.push(file);
    this.setState({
      fileList,
    });
  }

  renderFileList() {
    const { fileList } = this.state;
    return fileList.map(file => (
      <Row className="file-name" key={file.tempKey}>
        <Col>{file.name}</Col>
        <Col><ProgressBar now={file.percentage} label={`${file.percentage}%`} /></Col>
      </Row>
    ));
  }

  render() {
    return (

      <Container>
        <Jumbotron>
          <h1>react-webuploader Demo</h1>
          <p>
              A uploader tool based on  webuploader powered by react
          </p>
          <Button onClick={() => {
            window.open('https://github.com/luoquanquan/react-webuploader');
          }}
          >
            Fork On Github
          </Button>
        </Jumbotron>
        <Row>
          <Col>
            <h3>File List:</h3>
          </Col>
        </Row>
        <div className="file-list-wrap">
          {this.renderFileList()}
        </div>


        <Row>
          <Col><Button onClick={this.handleChooseFile}>Select Files</Button></Col>
          <Col><Button onClick={this.handleChooseFile}>Start Upload</Button></Col>
        </Row>

        <WebUploader
          server="http://localhost:3003"
          ref={(ref) => { this.uploader = ref; }}
          uploadProgress={this.uploadProgress}
          fileQueued={this.fileQueued}
          chunked
          onError={this.onUploadError}
        />
      </Container>
    );
  }
}

render(<App />, document.getElementById('root'));
