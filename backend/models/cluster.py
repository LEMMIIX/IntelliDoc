# cluster.py
import hdbscan
import numpy as np
import json
import sys
from scipy.spatial.distance import pdist, squareform

def analyze_embeddings(embeddings_array):
    """Analyze embeddings to understand their distribution"""
    # Calculate pairwise distances
    distances = pdist(embeddings_array, metric='euclidean')
    distance_matrix = squareform(distances)
    
    # Calculate statistics
    avg_distance = np.mean(distances)
    min_distance = np.min(distances)
    max_distance = np.max(distances)
    
    print(f"Distance Analysis:", file=sys.stderr)
    print(f"Average distance between documents: {avg_distance:.4f}", file=sys.stderr)
    print(f"Minimum distance between documents: {min_distance:.4f}", file=sys.stderr)
    print(f"Maximum distance between documents: {max_distance:.4f}", file=sys.stderr)
    
    # Find closest pairs
    min_indices = np.where(distance_matrix == min_distance)
    min_indices = [(i, j) for i, j in zip(*min_indices) if i < j]
    print(f"Closest document pairs (indices): {min_indices}", file=sys.stderr)
    
    return avg_distance

def main():
    try:
        # 1. Read file path from arguments
        input_file = sys.argv[1]
        
        # 2. Load embeddings from file
        with open(input_file, 'r') as f:
            embeddings = json.load(f)
            
        print(f"\nProcessing {len(embeddings)} documents", file=sys.stderr)
            
        # 3. Convert embeddings to proper numpy array
        embeddings_array = np.array([np.array(emb).flatten() for emb in embeddings])
        
        print(f"Embeddings shape: {embeddings_array.shape}", file=sys.stderr)
        
        # 4. Analyze embeddings
        avg_distance = analyze_embeddings(embeddings_array)
        
        # 5. Adjust clustering parameters based on the data
        min_cluster_size = min(3, len(embeddings))  # Start with smaller clusters
        
        print(f"\nClustering Parameters:", file=sys.stderr)
        print(f"min_cluster_size: {min_cluster_size}", file=sys.stderr)
        
        # 6. Perform clustering with adjusted parameters
        # Removed epsilon parameter and simplified the clustering
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size,
            min_samples=1,
            metric='euclidean',
            cluster_selection_method='eom'
        )
        
        cluster_labels = clusterer.fit_predict(embeddings_array)
        
        # 7. Analyze clustering results
        n_clusters = len(set(cluster_labels[cluster_labels != -1]))
        n_noise = sum(cluster_labels == -1)
        
        print(f"\nClustering Results:", file=sys.stderr)
        print(f"Number of clusters found: {n_clusters}", file=sys.stderr)
        print(f"Number of noise points: {n_noise}", file=sys.stderr)
        
        if n_clusters > 0:
            for cluster_id in range(n_clusters):
                cluster_size = sum(cluster_labels == cluster_id)
                print(f"Cluster {cluster_id} size: {cluster_size}", file=sys.stderr)
                
            # Calculate cluster probabilities for each point
            probabilities = clusterer.probabilities_
            print(f"\nMembership Probabilities:", file=sys.stderr)
            for i, (label, prob) in enumerate(zip(cluster_labels, probabilities)):
                print(f"Document {i}: Cluster {label} (Probability: {prob:.4f})", file=sys.stderr)
        else:
            print("\nNo clusters found. Trying with looser parameters...", file=sys.stderr)
            # Try again with more relaxed parameters
            clusterer = hdbscan.HDBSCAN(
                min_cluster_size=2,  # Reduce minimum cluster size
                min_samples=1,
                metric='euclidean',
                cluster_selection_method='leaf'  # Try different selection method
            )
            cluster_labels = clusterer.fit_predict(embeddings_array)
            n_clusters = len(set(cluster_labels[cluster_labels != -1]))
            print(f"Second attempt results: {n_clusters} clusters found", file=sys.stderr)
        
        # 8. Output cluster labels as JSON
        print(json.dumps(cluster_labels.tolist()))

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()