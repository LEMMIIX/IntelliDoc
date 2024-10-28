# cluster.py
import hdbscan
import numpy as np
import json
import sys
from scipy.spatial.distance import pdist, squareform
from time import perf_counter

def analyze_embeddings_fast(embeddings_array):
    """Quickly analyze embeddings using vectorized operations"""
    # Calculate distances using vectorized operations
    distances = pdist(embeddings_array, metric='euclidean')
    
    stats = {
        'avg_distance': np.mean(distances),
        'min_distance': np.min(distances),
        'max_distance': np.max(distances)
    }
    
    # Only find closest pairs if min_distance is very small (indicating similar documents)
    if stats['min_distance'] < 0.1:
        distance_matrix = squareform(distances)
        min_indices = np.where(distance_matrix == stats['min_distance'])
        stats['closest_pairs'] = [(int(i), int(j)) for i, j in zip(*min_indices) if i < j]
    
    return stats

def perform_clustering(embeddings_array, min_cluster_size):
    """Perform clustering with given parameters"""
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=2,
        metric='euclidean',
        cluster_selection_method='eom',
        algorithm='best',  # Automatically choose best algorithm
        core_dist_n_jobs=-1  # Use all available CPU cores
    )
    
    return clusterer.fit_predict(embeddings_array)

def main():
    try:
        start_time = perf_counter()
        print(f"[INFO] Starting clustering process...", file=sys.stderr)
        
        # 1. Load embeddings
        with open(sys.argv[1], 'r') as f:
            embeddings = json.load(f)
            
        n_docs = len(embeddings)
        print(f"[INFO] Processing {n_docs} documents", file=sys.stderr)
        
        # 2. Convert to numpy array efficiently
        embeddings_array = np.array(embeddings, dtype=np.float32)  # Use float32 for better performance
        
        # 3. Quick analysis
        print(f"[INFO] Analyzing document similarities...", file=sys.stderr)
        stats = analyze_embeddings_fast(embeddings_array)
        
        # 4. Determine clustering parameters based on dataset
        min_cluster_size = min(3, n_docs)
        
        # 5. Perform initial clustering
        print(f"[INFO] Performing clustering...", file=sys.stderr)
        cluster_labels = perform_clustering(embeddings_array, min_cluster_size)
        
        # 6. Analyze results
        n_clusters = len(set(cluster_labels[cluster_labels != -1]))
        n_noise = sum(cluster_labels == -1)
        
        # 7. Try relaxed parameters if no clusters found
        if n_clusters == 0 and n_docs >= 2:
            print(f"[INFO] Retrying with relaxed parameters...", file=sys.stderr)
            cluster_labels = perform_clustering(embeddings_array, min_cluster_size=2)
            n_clusters = len(set(cluster_labels[cluster_labels != -1]))
            n_noise = sum(cluster_labels == -1)
        
        # 8. Print summary
        end_time = perf_counter()
        print(f"\n[SUMMARY] Clustering completed in {end_time - start_time:.2f}s", file=sys.stderr)
        print(f"[SUMMARY] Documents processed: {n_docs}", file=sys.stderr)
        print(f"[SUMMARY] Clusters found: {n_clusters}", file=sys.stderr)
        print(f"[SUMMARY] Noise points: {n_noise}", file=sys.stderr)
        print(f"[SUMMARY] Avg distance between docs: {stats['avg_distance']:.4f}", file=sys.stderr)
        
        if n_clusters > 0:
            cluster_sizes = [sum(cluster_labels == i) for i in range(n_clusters)]
            print(f"[SUMMARY] Cluster sizes: {cluster_sizes}", file=sys.stderr)
        
        # 9. Output results
        print(json.dumps(cluster_labels.tolist()))

    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
