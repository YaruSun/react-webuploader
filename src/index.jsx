import React from 'react';
import uuid from 'uuid';
import PropTypes from 'prop-types';
import $ from 'jquery';

window.jQuery = $;

const noop = () => {};

const webuploader = require('webuploader');

export default class WebUploader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    };

    this.key = props.key || uuid();
  }

  componentDidMount() {
    this.initWebUploaderHook();
    this.createWebUploaderInterface();
    this.bindWebUploaderEvent();
  }

  initWebUploaderHook() {
    const {
      props: {
        server,
      },
    } = this;
    webuploader.Uploader.register({
      'before-send-file': 'beforeSendFile',
      'before-send': 'beforeSend',
      'after-send-file': 'afterSendFile',
    }, {
      beforeSendFile(file) {
        const dfd = new $.Deferred();
        const { md5, size, ext } = file;
        // 通过 md5 监测文件是否上传过
        $.get(`${server}/upload/filecheck?md5=${
          md5
        }&size=${
          size
        }&ext=${
          ext
        }`).done(({ exists, path }) => {
          if (exists) {
            file.path = path;
            this.uploader.skipFile(file);
            dfd.reject();
          } else {
            dfd.resolve();
          }
        }).fail(() => {
          dfd.resolve();
        });
        return $.when(dfd);
      },
      beforeSend({
        file: {
          md5, ext, size,
        },
        chunk,
      }) {
        // 分片验证是否已传过，用于断点续传
        const dfd = new $.Deferred();

        $.get(`${server}/upload/chunkcheck?md5=${
          md5
        }&chunk=${
          chunk
        }&size=${
          size
        }&ext=${
          ext
        }`)
          .done(({ exists }) => {
            if (exists) {
              dfd.reject();
            } else {
              dfd.resolve();
            }
          })
          .fail(() => {
            dfd.resolve();
          });

        return $.when(dfd);
      },
      afterSendFile(file) {
        const { md5, size, ext } = file;
        const { chunkSize } = this.options;
        const chunks = Math.ceil(size / chunkSize) || 0;
        if (chunks > 1) {
          const dfd = new $.Deferred();
          $.ajax({
            url: `${server}/upload/chunksmerge`,
            method: 'POST',
            data: JSON.stringify({
              md5, size, ext, chunks,
            }),
            contentType: 'application/json',
          })
            .done(({ path }) => {
              file.path = path;
              dfd.resolve();
            })
            .fail(() => {
              dfd.reject();
            });
          return $.when(dfd);
        }
      },

    });
  }

  createWebUploaderInterface() {
    const {
      props: {
        server,
        key,
        chunked,
        formData,
        fileNumLimit,
        threads,
        auto,
      },
    } = this;
    this.uploader = webuploader.create({
      pick: `#${key}`,
      server: `${server}/upload`,
      chunked,
      formData,
      fileNumLimit,
      threads,
      auto,
    });
  }

  bindWebUploaderEvent() {
    const {
      props: {
        fileQueued,
        uploadStart,
        uploadSuccess,
        uploadComplete,
        uploadProgress,
        onError,
      },
    } = this;
    this.uploader
      // fileQueued 文件加入队列
      .on('fileQueued', function (file) {
        this.md5File(file, 0, 1 * 1024 * 1024).then((ret) => {
          file.md5 = ret;
          this.options.formData.md5 = ret;
          file.tempKey = uuid();
          // 刚刚入队的文件进度设置为 0
          file.percentage = 0;
          // 需要保证文件获取 md5 完成后再回掉, 保证 ui 和逻辑的联动
          fileQueued(file);
          this.upload();
        });
      })
      // 上传开始
      .on('uploadStart', (file) => {
        uploadStart(file);
      })
      // 文件上传成功时触发
      .on('uploadSuccess', (file, data) => {
        uploadSuccess(file, data);
        if (data && data.path) {
          file.path = data.path;
        }
        uploadSuccess(file);
      })
      // 上传完成, 成功 or 失败都会触发
      .on('uploadComplete', function (file) {
        uploadComplete();
        this.removeFile(file.id);
      })
      // 更新上传进度
      .on('uploadProgress', (file, percentage) => {
        uploadProgress(file, Math.floor(percentage * 100));
      })
      .on('error', (error) => {
        console.log(`当前时间 ${Date.now()}: debug 的数据是 error: `, error);
        onError(error);
      });
  }

  handleChooseFile() {
    const uploaderBtn = this.uploaderWrap.querySelector('input');

    if (uploaderBtn) {
      uploaderBtn.click();
    } else {
      throw new Error(
        `react-webuploader init failed~
        please reload the page or contact your developer`,
      );
    }
  }

  render() {
    return (
      <div
        ref={(ref) => { this.uploaderWrap = ref; }}
        id={this.key}
        key={this.key}
      />
    );
  }
}

WebUploader.propTypes = {
  /**
   * base Conf
   */
  // 上传组件标识
  key: PropTypes.string,
  // 是否要分片处理大文件上传
  chunked: PropTypes.bool,
  // 上传服务域名
  server: PropTypes.string.isRequired,
  // 文件上传请求的参数表, 每次发送都会发送此对象中的参数
  formData: PropTypes.object, // eslint-disable-line
  // 验证文件总数量, 超出则不允许加入队列, 默认值 5
  fileNumLimit: PropTypes.number,
  // 上传并发数, 允许同时最大上传进程数, 默认值 3
  threads: PropTypes.number,
  // 选择文件后是否自动上传
  auto: PropTypes.bool,
  /**
   * call Backs
   */
  // 文件加入队列
  fileQueued: PropTypes.func,
  // 开始上传
  uploadStart: PropTypes.func,
  // 上传成功
  uploadSuccess: PropTypes.func,
  // 上传完成
  uploadComplete: PropTypes.func,
  // 更新进度
  uploadProgress: PropTypes.func,
  // 错误处理
  onError: PropTypes.func,
};

WebUploader.defaultProps = {
  key: uuid(),
  chunked: false,
  formData: {
    md5: '',
  },
  fileNumLimit: 5,
  threads: 3,
  auto: true,
  fileQueued: noop,
  uploadStart: noop,
  uploadSuccess: noop,
  uploadComplete: noop,
  uploadProgress: noop,
  onError: noop,
};
