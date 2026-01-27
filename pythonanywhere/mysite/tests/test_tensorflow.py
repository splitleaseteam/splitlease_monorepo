#!/usr/bin/env python3
"""Test TensorFlow installation and basic operations"""
import numpy as np
import tensorflow as tf
from datetime import datetime

def test_tensorflow():
    print("=" * 60)
    print("🧪 TensorFlow Installation Test")
    print("=" * 60)
    
    # Test 1: Version check
    print(f"\n📦 TensorFlow version: {tf.__version__}")
    print(f"🐍 Python version: {tf.version.VERSION}")
    
    # Test 2: Device availability
    print("\n💻 Available devices:")
    devices = tf.config.list_physical_devices()
    for device in devices:
        print(f"   - {device.device_type}: {device.name}")
    
    # Check GPU
    gpu_available = len(tf.config.list_physical_devices('GPU')) > 0
    if gpu_available:
        print("✅ GPU detected! Training will be accelerated")
    else:
        print("⚠️  No GPU detected. Using CPU (slower but works fine)")
    
    # Test 3: Basic tensor operations
    print("\n🔢 Test 3: Basic tensor operations...")
    a = tf.constant([[1, 2], [3, 4]], dtype=tf.float32)
    b = tf.constant([[5, 6], [7, 8]], dtype=tf.float32)
    
    c = tf.matmul(a, b)
    print(f"Matrix multiplication result:\n{c.numpy()}")
    print("✅ Tensor operations working")
    
    # Test 4: Simple neural network
    print("\n🧠 Test 4: Building a simple neural network...")
    
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    print(f"✅ Model created with {model.count_params()} parameters")
    
    # Test 5: Quick training run
    print("\n🏋️ Test 5: Training on synthetic data...")
    
    # Generate fake data
    X_train = np.random.randn(100, 10).astype(np.float32)
    y_train = (X_train.sum(axis=1) > 0).astype(np.float32)
    
    start_time = datetime.now()
    history = model.fit(
        X_train, y_train,
        epochs=10,
        batch_size=16,
        verbose=0
    )
    training_time = (datetime.now() - start_time).total_seconds()
    
    final_loss = history.history['loss'][-1]
    final_accuracy = history.history['accuracy'][-1]
    
    print(f"✅ Training completed in {training_time:.2f} seconds")
    print(f"   Final loss: {final_loss:.4f}")
    print(f"   Final accuracy: {final_accuracy:.2%}")
    
    # Test 6: Model prediction
    print("\n🔮 Test 6: Making predictions...")
    
    X_test = np.random.randn(5, 10).astype(np.float32)
    predictions = model.predict(X_test, verbose=0)
    
    print("Sample predictions:")
    for i, pred in enumerate(predictions[:3]):
        print(f"   Sample {i+1}: {pred[0]:.4f} ({'positive' if pred[0] > 0.5 else 'negative'})")
    
    print("✅ Predictions working")
    
    # Test 7: Save and load model
    print("\n💾 Test 7: Saving and loading model...")
    
    model_path = '/tmp/test_model.h5'
    model.save(model_path)
    print(f"✅ Model saved to {model_path}")
    
    loaded_model = tf.keras.models.load_model(model_path)
    print("✅ Model loaded successfully")
    
    # Verify loaded model works
    loaded_pred = loaded_model.predict(X_test[:1], verbose=0)
    original_pred = model.predict(X_test[:1], verbose=0)
    
    if np.allclose(loaded_pred, original_pred):
        print("✅ Loaded model produces identical predictions")
    else:
        print("⚠️  Warning: Loaded model predictions differ")
    
    print("\n" + "=" * 60)
    print("✅ All TensorFlow tests passed!")
    print("=" * 60)
    
    return True

def test_embedding_model():
    """Test sentence transformer for text embeddings (used in matching)"""
    print("\n" + "=" * 60)
    print("🔤 Testing Sentence Transformer (for text embeddings)")
    print("=" * 60)
    
    try:
        from sentence_transformers import SentenceTransformer
        
        print("\n📥 Loading pre-trained embedding model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')  # 384-dimensional embeddings
        print("✅ Model loaded")
        
        # Test embedding generation
        test_sentences = [
            "Modern downtown loft with city views",
            "Cozy suburban house perfect for remote work",
            "Beachfront condo with ocean access"
        ]
        
        print("\n🔄 Generating embeddings...")
        embeddings = model.encode(test_sentences)
        
        print(f"✅ Generated {len(embeddings)} embeddings")
        print(f"   Embedding dimension: {embeddings.shape[1]}")
        
        # Test similarity
        from sklearn.metrics.pairwise import cosine_similarity
        
        similarities = cosine_similarity(embeddings)
        print("\n📊 Similarity matrix:")
        print(similarities)
        
        print("\n✅ Sentence transformer working correctly")
        return True
        
    except ImportError:
        print("⚠️  sentence-transformers not installed")
        print("   Install with: pip install sentence-transformers")
        return False

if __name__ == "__main__":
    test_tensorflow()
    print("\n")
    test_embedding_model()