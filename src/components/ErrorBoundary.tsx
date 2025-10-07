import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Niečo sa pokazilo</h2>
                    <p>Ospravedlňujeme sa, aplikácia narazila na chybu.</p>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Skúsiť znova
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;