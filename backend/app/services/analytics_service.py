
import pandas as pd
import io

def analyze_csv(file_bytes):

    df = pd.read_csv(io.BytesIO(file_bytes))

    return df.describe().to_dict()
