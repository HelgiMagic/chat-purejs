import './style.css';

class ChatModel {
  constructor() {
    this.messages = [];
  }

  loadMessages() {
    return fetch('MOCK_DATA.json')
      .then((response) => response.json())
      .then((data) => {
        this.messages = data.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        return this.messages;
      });
  }

  addMessage(message) {
    this.messages.push(message);
  }

  getMessages(startIndex, batchSize) {
    return this.messages.slice(startIndex, startIndex + batchSize);
  }
}

class ChatView {
  constructor() {
    this.messageList = document.getElementById('message-list');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message-input');
  }

  formatDate(dateString) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  displayMessages(messages) {
    messages.forEach((message) => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message';

      const metaElement = document.createElement('div');
      metaElement.className = 'meta';
      metaElement.textContent = `${message.user_id} • ${this.formatDate(
        message.created_at
      )}`;

      const textElement = document.createElement('div');
      textElement.textContent = message.message;

      messageElement.appendChild(metaElement);
      messageElement.appendChild(textElement);
      this.messageList.appendChild(messageElement);
    });
  }

  clearInput() {
    this.messageInput.value = '';
  }
}

class ChatController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentIndex = 0;
    this.batchSize = 10;

    this.view.messageForm.addEventListener(
      'submit',
      this.handleSendMessage.bind(this)
    );
    this.view.messageList.addEventListener(
      'scroll',
      this.handleScroll.bind(this)
    );

    this.model.loadMessages().then(() => this.loadMessages());
  }

  loadMessages() {
    const messages = this.model.getMessages(this.currentIndex, this.batchSize);
    this.view.displayMessages(messages);
    this.currentIndex += this.batchSize;
  }

  handleSendMessage(event) {
    event.preventDefault();
    const newMessage = {
      user: 'Me',
      message: this.view.messageInput.value,
    };
    this.model.addMessage(newMessage);
    this.view.displayMessages([newMessage]);
    this.view.clearInput();
    this.view.messageList.scrollTop = this.view.messageList.scrollHeight;
  }

  handleScroll() {
    if (
      this.view.messageList.scrollTop + this.view.messageList.clientHeight >=
      this.view.messageList.scrollHeight
    ) {
      this.loadMessages();
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const model = new ChatModel();
  const view = new ChatView();
  const controller = new ChatController(model, view);
});
