// Simple message component for displaying individual messages
function ChatMessage({ message }) {
  return (
    <div className={`message ${message.sender}`}>
      {message.text}
    </div>
  );
}

export default ChatMessage;