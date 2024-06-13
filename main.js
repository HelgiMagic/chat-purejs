import './style.css';

class ChatModel {
  constructor() {
    this.messages = [];
    this.currentUserId = 1;
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

  deleteMessage(messageId) {
    this.messages = this.messages.filter((message) => message.id !== messageId);
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
    this.dropdown = document.querySelector('.dropdown');
  }

  toggleDropdown() {
    this.dropdown.classList.toggle('show');
  }

  formatDateInRussian(dateString) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat('ru-RU', options).format(
      new Date(dateString)
    );
  }

  displayMessages(currentUserId, messages, prepend = false) {
    messages.forEach((message) => {
      const messageRowElement = document.createElement('div');
      messageRowElement.className = 'message-row';

      const messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.dataset.id = message.id;

      const metaElement = document.createElement('div');
      metaElement.className = 'meta';
      metaElement.innerHTML = `<span>${this.formatDateInRussian(
        message.created_at
      )}</span>`;

      const textElement = document.createElement('div');
      textElement.textContent = message.message;

      messageElement.appendChild(metaElement);
      messageElement.appendChild(textElement);

      if (message.user_id === currentUserId) {
        messageElement.classList.add('my-message');

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML =
          '<svg class="delete__svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none"><path class="delete__svg__path" d="M6.364 4.95 11.314 0l1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95L0 11.314l4.95-4.95L0 1.414 1.414 0z" fill="#fd6a6a"></path></svg>';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => this.handleDeleteMessage(message.id);
        metaElement.appendChild(deleteButton);

        messageRowElement.classList.add('my-row');
      } else {
        messageRowElement.classList.add('other-row');
      }

      messageRowElement.appendChild(messageElement);

      if (prepend) {
        this.messageList.insertBefore(
          messageRowElement,
          this.messageList.firstChild
        );
      } else {
        this.messageList.appendChild(messageRowElement);
      }
    });
  }

  clearInput() {
    this.messageInput.value = '';
  }

  removeMessageElement(messageId) {
    const messageRowElement = this.messageList.querySelector(
      `.message[data-id='${messageId}']`
    ).parentElement;
    if (messageRowElement) {
      this.messageList.removeChild(messageRowElement);
    }
  }

  handleDeleteMessage(messageId) {
    if (this.onDeleteMessage) {
      this.onDeleteMessage(messageId);
    }
  }

  handleDropdownClick(event) {
    if (event.target.classList.contains('emoji')) {
      const cursorPosition = this.messageInput.selectionStart;
      this.messageInput.value =
        this.messageInput.value.substring(0, cursorPosition) +
        event.target.textContent +
        this.messageInput.value.substring(cursorPosition);
    }
    this.toggleDropdown();
  }
}

class ChatController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentIndex = 0;
    this.batchSize = 10;

    this.view.messageForm.addEventListener('submit', (event) => {
      this.handleSendMessage(event);
    });

    this.view.messageList.addEventListener('scroll', () => {
      this.handleScroll();
    });

    this.view.onDeleteMessage = (messageId) => {
      this.handleDeleteMessage(messageId);
    };

    this.view.dropdown.addEventListener('click', (event) => {
      this.view.handleDropdownClick(event);
    });

    this.model.loadMessages().then(() => {
      this.currentIndex = this.model.messages.length - this.batchSize;
      if (this.currentIndex < 0) this.currentIndex = 0;
      this.loadMessages();
      this.view.messageList.scrollTop = this.view.messageList.scrollHeight;
    });
  }

  // чтобы полноценно реализовать infinity scroll нужна порционная загрузка данных с сервера, на бесплатных вариантах такого нет. Поэтому просто реализовал подгрузку через обычный локальный JSON и постепенное отображение
  loadMessages(prepend = false) {
    let messages = this.model.getMessages(this.currentIndex, this.batchSize);
    if (prepend) {
      messages = messages.reverse();
    }

    const previousScrollHeight = this.view.messageList.scrollHeight;

    this.view.displayMessages(this.model.currentUserId, messages, prepend);

    if (prepend) {
      const newScrollHeight = this.view.messageList.scrollHeight;
      this.view.messageList.scrollTop = newScrollHeight - previousScrollHeight;
    }

    this.currentIndex -= this.batchSize;
    if (this.currentIndex < 0) this.currentIndex = 0;
  }

  handleSendMessage(event) {
    event.preventDefault();
    const newMessage = {
      id: Date.now(), // Use current timestamp as a unique ID for simplicity
      user_id: this.model.currentUserId,
      message: this.view.messageInput.value,
      created_at: new Date().toISOString(),
    };
    this.model.addMessage(newMessage);
    this.view.displayMessages(this.model.currentUserId, [newMessage]);
    this.view.clearInput();
    this.view.messageList.scrollTop = this.view.messageList.scrollHeight;
  }

  handleScroll() {
    if (this.view.messageList.scrollTop === 0) {
      this.loadMessages(true);
    }
  }

  handleDeleteMessage(messageId) {
    this.model.deleteMessage(messageId);
    this.view.removeMessageElement(messageId);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const model = new ChatModel();
  const view = new ChatView();
  const controller = new ChatController(model, view);
});
