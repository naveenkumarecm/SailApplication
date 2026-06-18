import React from 'react';
import './BookReferences.css';

function BookReferences({ books }) {
  return (
    <section className="books-section">
      <h3 className="books-title">
        <span className="books-icon">📚</span>
        Further Reading — Books & Archives
      </h3>
      <p className="books-subtitle">
        References from Open Library • Free to access
      </p>

      <div className="books-grid">
        {books.map((book, idx) => (
          <a
            key={idx}
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="book-card"
          >
            <div className="book-cover-container">
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="book-cover"
                  loading="lazy"
                />
              ) : (
                <div className="book-cover-placeholder">
                  <span>📖</span>
                </div>
              )}
            </div>
            <div className="book-info">
              <h4 className="book-title">{book.title}</h4>
              {book.authors && book.authors.length > 0 && (
                <p className="book-author">by {book.authors.join(', ')}</p>
              )}
              {book.year && (
                <span className="book-year">{book.year}</span>
              )}
              {book.subjects && book.subjects.length > 0 && (
                <div className="book-subjects">
                  {book.subjects.slice(0, 3).map((s, i) => (
                    <span key={i} className="book-subject">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default BookReferences;
